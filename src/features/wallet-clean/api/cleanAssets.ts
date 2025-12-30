import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
  switchChain,
  getAccount,
} from "@wagmi/core";
import { parseUnits, maxUint256, erc20Abi } from "viem";
import { wagmiConfig as config } from "@/app/[locale]/providers";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export type Asset = {
  id: string;
  address: string;
  symbol: string;
  name: string;
  balance: string;
  chainId: number;
  decimals?: number;
};

/**
 * Check if token needs approval
 */
export async function checkApproval(
  tokenAddress: string,
  ownerAddress: string,
  chainId: number
): Promise<boolean> {
  try {
    const allowance = (await readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "allowance",
      args: [ownerAddress as `0x${string}`, BURN_ADDRESS as `0x${string}`],
      chainId,
    })) as bigint;

    return allowance > 0n;
  } catch (error) {
    console.error("Error checking approval:", error);
    return false;
  }
}

/**
 * Approve token spending
 */
export async function approveToken(
  tokenAddress: string,
  chainId: number
): Promise<string> {
  const hash = await writeContract(config, {
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "approve",
    args: [BURN_ADDRESS as `0x${string}`, maxUint256],
    chainId,
  });

  // Wait for confirmation
  await waitForTransactionReceipt(config, {
    hash,
    chainId,
  });

  return hash;
}

/**
 * Get token decimals
 */
async function getTokenDecimals(
  tokenAddress: string,
  chainId: number
): Promise<number> {
  try {
    const decimals = (await readContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
      chainId,
    })) as number;
    return decimals;
  } catch (error) {
    console.error("Error getting decimals, defaulting to 18:", error);
    return 18; // Default to 18 if we can't read
  }
}

/**
 * Transfer token to burn address
 */
export async function transferToken(
  tokenAddress: string,
  amount: string,
  chainId: number,
  decimals?: number
): Promise<string> {
  // Get decimals if not provided
  const tokenDecimals =
    decimals ?? (await getTokenDecimals(tokenAddress, chainId));

  const amountInWei = parseUnits(amount, tokenDecimals);

  const hash = await writeContract(config, {
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "transfer",
    args: [BURN_ADDRESS as `0x${string}`, amountInWei],
    chainId,
  });

  // Wait for confirmation
  await waitForTransactionReceipt(config, {
    hash,
    chainId,
  });

  return hash;
}

/**
 * Switch to the correct chain if needed
 */
async function ensureCorrectChain(targetChainId: number): Promise<void> {
  const account = getAccount(config);
  const currentChainId = account.chainId;

  if (currentChainId !== targetChainId) {
    console.log(
      `🔄 Switching from chain ${currentChainId} to ${targetChainId}`
    );
    await switchChain(config, { chainId: targetChainId });
    // Wait a bit for the switch to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

/**
 * Clean a single asset (approve if needed + transfer)
 */
export async function cleanSingleAsset(
  asset: Asset,
  ownerAddress: string,
  onProgress: (
    step: "approving" | "approved" | "transferring",
    txHash?: string
  ) => void
): Promise<void> {
  try {
    console.log(
      `🧹 Starting to clean: ${asset.symbol} (${asset.address.slice(0, 8)}...)`
    );

    // Switch to correct chain
    await ensureCorrectChain(asset.chainId);
    console.log(`✅ On chain ${asset.chainId}`);

    // Check if approval is needed
    console.log("🔍 Checking approval...");
    const hasApproval = await checkApproval(
      asset.address,
      ownerAddress,
      asset.chainId
    );
    console.log(`${hasApproval ? "✅" : "❌"} Has approval: ${hasApproval}`);

    if (!hasApproval) {
      console.log("📝 Requesting approval...");
      onProgress("approving");
      const approvalHash = await approveToken(asset.address, asset.chainId);
      console.log(`✅ Approved! Hash: ${approvalHash.slice(0, 10)}...`);
      onProgress("approved", approvalHash);
    } else {
      onProgress("approved");
    }

    // Transfer token
    console.log("💸 Transferring token...");
    onProgress("transferring");
    const transferHash = await transferToken(
      asset.address,
      asset.balance,
      asset.chainId,
      asset.decimals
    );
    console.log(`✅ Transferred! Hash: ${transferHash.slice(0, 10)}...`);
    onProgress("transferring", transferHash);
  } catch (error) {
    console.error(`❌ Error cleaning asset ${asset.symbol}:`, error);
    throw error;
  }
}

/**
 * Group assets by chain ID
 */
function groupAssetsByChain(assets: Asset[]): Map<number, Asset[]> {
  const groups = new Map<number, Asset[]>();
  for (const asset of assets) {
    const group = groups.get(asset.chainId) || [];
    group.push(asset);
    groups.set(asset.chainId, group);
  }
  return groups;
}

/**
 * Clean multiple assets sequentially, grouped by chain
 */
export async function cleanAssets(
  assets: Asset[],
  ownerAddress: string,
  onAssetProgress: (
    assetId: string,
    step: "approving" | "approved" | "transferring" | "completed" | "error",
    txHash?: string,
    error?: string
  ) => void,
  onComplete: () => void
): Promise<void> {
  // Group assets by chain to minimize network switches
  const assetsByChain = groupAssetsByChain(assets);

  console.log(
    `🚀 Starting to clean ${assets.length} assets across ${assetsByChain.size} chains`
  );

  // Process each chain group
  for (const [chainId, chainAssets] of assetsByChain) {
    console.log(
      `\n🔗 Processing ${chainAssets.length} assets on chain ${chainId}`
    );

    for (const asset of chainAssets) {
      try {
        await cleanSingleAsset(asset, ownerAddress, (step, txHash) => {
          onAssetProgress(asset.id, step, txHash);
        });
        onAssetProgress(asset.id, "completed");
        console.log(`✅ Completed: ${asset.symbol}`);
      } catch (error) {
        console.error(`❌ Error cleaning asset ${asset.symbol}:`, error);
        onAssetProgress(
          asset.id,
          "error",
          undefined,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  console.log("\n🎉 All assets processed!");
  onComplete();
}

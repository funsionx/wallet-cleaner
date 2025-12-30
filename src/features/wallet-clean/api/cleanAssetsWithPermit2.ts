import {
  writeContract,
  waitForTransactionReceipt,
  switchChain,
  getAccount,
  readContract,
} from "@wagmi/core";
import { parseUnits, erc20Abi, type Address } from "viem";
import { wagmiConfig as config } from "@/app/[locale]/providers";
import {
  PERMIT2_ADDRESS,
  checkPermit2Approval,
  batchApprovePermit2,
} from "./permit2";

const BURN_ADDRESS: Address = "0x000000000000000000000000000000000000dEaD";

export type Asset = {
  id: string;
  address: Address;
  symbol: string;
  name: string;
  balance: string;
  chainId: number;
  decimals?: number;
};

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
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

/**
 * Get token decimals
 */
async function getTokenDecimals(
  tokenAddress: Address,
  chainId: number
): Promise<number> {
  try {
    const decimals = (await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
      chainId,
    })) as number;
    return decimals;
  } catch (error) {
    console.error("Error getting decimals, defaulting to 18:", error);
    return 18;
  }
}

/**
 * Transfer token to burn address
 */
async function transferToken(
  tokenAddress: Address,
  amount: string,
  chainId: number,
  decimals?: number
): Promise<string> {
  const tokenDecimals =
    decimals ?? (await getTokenDecimals(tokenAddress, chainId));
  const amountInWei = parseUnits(amount, tokenDecimals);

  const hash = await writeContract(config, {
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "transfer",
    args: [BURN_ADDRESS, amountInWei],
    chainId,
  });

  await waitForTransactionReceipt(config, {
    hash,
    chainId,
  });

  return hash;
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
 * Clean assets using Permit2 batch approvals
 */
export async function cleanAssetsWithPermit2(
  assets: Asset[],
  ownerAddress: Address,
  onProgress: (
    step:
      | "switching_chain"
      | "checking_approvals"
      | "batch_approving"
      | "transferring"
      | "completed"
      | "error",
    data?: {
      chainId?: number;
      assetId?: string;
      assetSymbol?: string;
      txHash?: string;
      error?: string;
      currentIndex?: number;
      totalInBatch?: number;
    }
  ) => void
): Promise<void> {
  const assetsByChain = groupAssetsByChain(assets);

  console.log(
    `🚀 Starting to clean ${assets.length} assets across ${assetsByChain.size} chains using Permit2`
  );

  for (const [chainId, chainAssets] of assetsByChain) {
    try {
      console.log(
        `\n🔗 Processing ${chainAssets.length} assets on chain ${chainId}`
      );

      // Switch to chain
      onProgress("switching_chain", { chainId });
      await ensureCorrectChain(chainId);

      // Check which tokens need Permit2 approval
      onProgress("checking_approvals", { chainId });
      const needsApproval: Address[] = [];

      for (const asset of chainAssets) {
        const hasApproval = await checkPermit2Approval(
          asset.address,
          ownerAddress,
          chainId
        );
        if (!hasApproval) {
          needsApproval.push(asset.address);
        }
      }

      // Batch approve all tokens that need it for Permit2
      if (needsApproval.length > 0) {
        console.log(
          `📝 Approving ${needsApproval.length} tokens for Permit2...`
        );
        onProgress("batch_approving", {
          chainId,
          totalInBatch: needsApproval.length,
        });

        await batchApprovePermit2(needsApproval, chainId, (index, txHash) => {
          console.log(
            `✅ Approved ${index + 1}/${needsApproval.length}: ${txHash.slice(
              0,
              10
            )}...`
          );
          onProgress("batch_approving", {
            chainId,
            currentIndex: index,
            totalInBatch: needsApproval.length,
            txHash,
          });
        });
      } else {
        console.log("✅ All tokens already approved for Permit2");
      }

      // Transfer all tokens
      for (let i = 0; i < chainAssets.length; i++) {
        const asset = chainAssets[i];
        console.log(
          `💸 Transferring ${asset.symbol} (${i + 1}/${chainAssets.length})...`
        );

        onProgress("transferring", {
          chainId,
          assetId: asset.id,
          assetSymbol: asset.symbol,
          currentIndex: i,
          totalInBatch: chainAssets.length,
        });

        const txHash = await transferToken(
          asset.address,
          asset.balance,
          chainId,
          asset.decimals
        );

        console.log(
          `✅ Transferred ${asset.symbol}: ${txHash.slice(0, 10)}...`
        );

        onProgress("completed", {
          chainId,
          assetId: asset.id,
          assetSymbol: asset.symbol,
          txHash,
        });
      }
    } catch (error) {
      console.error(`❌ Error processing chain ${chainId}:`, error);
      onProgress("error", {
        chainId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log("\n🎉 All assets processed!");
}

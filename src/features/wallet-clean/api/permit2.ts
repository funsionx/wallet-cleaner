import { writeContract, signTypedData } from "@wagmi/core";
import { maxUint256, type Address } from "viem";
import { wagmiConfig as config } from "@/app/[locale]/providers";

// Permit2 адреса (одинаковые на всех сетях)
export const PERMIT2_ADDRESS: Address =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3";

// ABI для Permit2 (только нужные функции)
const PERMIT2_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { internalType: "uint160", name: "amount", type: "uint160" },
      { internalType: "uint48", name: "expiration", type: "uint48" },
      { internalType: "uint48", name: "nonce", type: "uint48" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint160", name: "amount", type: "uint160" },
      { internalType: "uint48", name: "expiration", type: "uint48" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ERC20 ABI для approve Permit2
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Проверяет, есть ли у токена апрув для Permit2
 */
export async function checkPermit2Approval(
  tokenAddress: Address,
  ownerAddress: Address,
  chainId: number
): Promise<boolean> {
  try {
    const { readContract } = await import("@wagmi/core");
    const allowance = (await readContract(config, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [ownerAddress, PERMIT2_ADDRESS],
      chainId,
    })) as bigint;

    return allowance >= maxUint256 / 2n; // Проверяем достаточно ли большой апрув
  } catch (error) {
    console.error("Error checking Permit2 approval:", error);
    return false;
  }
}

/**
 * Апрувает токен для Permit2 (делается один раз для каждого токена)
 */
export async function approvePermit2(
  tokenAddress: Address,
  chainId: number
): Promise<string> {
  const hash = await writeContract(config, {
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [PERMIT2_ADDRESS, maxUint256],
    chainId,
  });

  const { waitForTransactionReceipt } = await import("@wagmi/core");
  await waitForTransactionReceipt(config, {
    hash,
    chainId,
  });

  return hash;
}

/**
 * Батч-апрув всех токенов для Permit2
 * Возвращает массив хэшей транзакций
 */
export async function batchApprovePermit2(
  tokens: Address[],
  chainId: number,
  onProgress: (tokenIndex: number, txHash: string) => void
): Promise<string[]> {
  const hashes: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const hash = await approvePermit2(tokens[i], chainId);
    hashes.push(hash);
    onProgress(i, hash);
  }

  return hashes;
}

/**
 * Создает подпись Permit2 для батча токенов
 * Пока не используем, так как для burn адреса все равно нужен transferFrom
 */
export async function signPermit2Batch(
  tokens: Address[],
  amounts: bigint[],
  spender: Address,
  deadline: bigint,
  ownerAddress: Address,
  chainId: number
): Promise<string> {
  // Получаем nonces для всех токенов
  const { readContract } = await import("@wagmi/core");
  const nonces: number[] = [];

  for (const token of tokens) {
    const allowanceData = await readContract(config, {
      address: PERMIT2_ADDRESS,
      abi: PERMIT2_ABI,
      functionName: "allowance",
      args: [token, spender],
      chainId,
    });
    nonces.push(Number(allowanceData[2]));
  }

  // Создаем типизированные данные для подписи
  const domain = {
    name: "Permit2",
    chainId,
    verifyingContract: PERMIT2_ADDRESS,
  };

  const types = {
    PermitBatch: [
      { name: "details", type: "PermitDetails[]" },
      { name: "spender", type: "address" },
      { name: "sigDeadline", type: "uint256" },
    ],
    PermitDetails: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
  };

  const details = tokens.map((token, i) => ({
    token,
    amount: amounts[i],
    expiration: deadline,
    nonce: nonces[i],
  }));

  const message = {
    details,
    spender,
    sigDeadline: deadline,
  };

  const signature = await signTypedData(config, {
    domain,
    types,
    primaryType: "PermitBatch",
    message,
  });

  return signature;
}

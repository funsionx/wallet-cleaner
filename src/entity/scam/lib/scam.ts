export type ScamContext = {
  symbol: string;
  name: string;
  usdPrice: number | null;
  usdValue: number | null;
  balanceHuman: number;
  holders?: number | null;
  logo?: string | null;
};

// Простой эвристический алгоритм определения скам-токенов.
// Цель: минимизировать ложноположительные, но помечать очевидный мусор.
export function isScamToken(ctx: ScamContext): boolean {
  const symbol = (ctx.symbol || "").trim().toUpperCase();
  const name = (ctx.name || "").trim();
  const price = typeof ctx.usdPrice === "number" ? ctx.usdPrice : null;
  const value = typeof ctx.usdValue === "number" ? ctx.usdValue : null;
  const balance = Number.isFinite(ctx.balanceHuman) ? ctx.balanceHuman : 0;
  const holders = typeof ctx.holders === "number" ? ctx.holders : null;

  if (ctx.logo) return false;
  // 1) Явные признаки: отсутствует символ и имя → высокий риск
  if (!symbol && !name) return true;

  if (!Number(ctx.usdPrice) && Number(ctx.usdValue) < 0.01) return true;

  // 2) Очень маленькая капитализация для владельца: цена есть, а стоимость < $0.1
  if (price !== null && value !== null && value < 0.1) return true;

  // 3) Ненормальные балансы: огромные дробные остатки при нулевой цене
  if ((price === null || price === 0) && balance > 0 && balance < 1e-6)
    return true;

  // 4) Подозрительные символы/названия
  const suspectPatterns = [/SCAM/i, /FAKE/i, /AIRDROP/i, /TEST/i, /ELIGIBLE/i];
  if (suspectPatterns.some((re) => re.test(symbol) || re.test(name)))
    return true;

  // 5) Мало держателей (если есть данные)
  if (holders !== null && holders < 50) return true;

  return false;
}

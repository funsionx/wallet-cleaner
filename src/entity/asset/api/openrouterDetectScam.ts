export type AiTokenInput = {
  address: string;
  symbol: string;
  name: string;
  chainId: number;
  usdPrice: number | null;
  usdValue: number | null;
  balance: string;
};

export type AiDetectResult = Record<
  string,
  { isScam: boolean; reason?: string }
>;

export async function aiDetectScam(
  tokens: AiTokenInput[],
  locale?: "en" | "ru"
): Promise<AiDetectResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || tokens.length === 0) return null;

  const baseURL = "https://openrouter.ai/api/v1";
  const model = process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast:free";

  const lang = locale === "ru" ? "ru" : "en";
  const prompt =
    lang === "ru"
      ? `Ты ассистент по гигиене криптокошелька. Для каждого токена определи, скам он или нет. Правила: 1) Считай скамом токены без цены USD или с ценой ≈0; 2) Считай скамом токены с неестественными/длинными названиями или символами (URL, эмодзи, хеши, «airdrop», «claim», «eligible», «test», «faucet», «gift», «promo», «free», «reward» и т.п.); 3) Считай скамом «dust» (очень малая стоимость баланса, например < $0.1), за исключением известных стейблкоинов (USDT, USDC, DAI, TUSD) и топовых токенов; 4) Отдавай краткую причину («нет цены», «мусорное название/ссылка», «очень малая стоимость», «подозрительное ключевое слово», «невероятный тикер» и т.д.). Ответ строго в виде минимизированного JSON-объекта по адресу контракта: {"0x..": {"isScam": true|false, "reason": "краткая причина"}, ...}. Никакого лишнего текста.`
      : `You are a crypto wallet hygiene assistant. For each token decide scam or not. Rules: 1) Treat as scam tokens with missing USD price or near-zero price; 2) Treat as scam tokens with unnatural/long names or symbols (URLs, emojis, hashes, words like "airdrop", "claim", "eligible", "test", "faucet", "gift", "promo", "free", "reward"); 3) Treat as scam any dust (very low USD value, e.g. < $0.1), except well-known stables (USDT, USDC, DAI, TUSD) and top tokens; 4) Provide a short reason ("no price", "spammy name/url", "very low value", "suspicious keyword", "implausible ticker", etc.). Respond ONLY valid minified JSON object keyed by contract address: {"0x..": {"isScam": true|false, "reason": "short reason"}, ...}. No extra text.`;

  const input = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "text",
            text: JSON.stringify(
              tokens.map((t) => ({
                address: t.address,
                chainId: t.chainId,
                symbol: t.symbol,
                name: t.name,
                usdPrice: t.usdPrice,
                usdValue: t.usdValue,
                balance: t.balance,
              }))
            ),
          },
        ],
      },
    ],
    temperature: 0,
  } as const;

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Wallet Cleaner",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as AiDetectResult;
    return parsed;
  } catch {
    // Sometimes models wrap JSON in code fences or add notes; try to extract
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as AiDetectResult;
      } catch {}
    }
    return null;
  }
}

Wallet Cleaner — Next.js приложение для очистки кошельков от скам-токенов и NFT в EVM сетях.

## Запуск

1. Скопируйте переменные окружения:

```
cp ENV_LOCAL_EXAMPLE.txt .env.local
```

2. Запустите dev-сервер:

```bash
npm run dev
```

Откройте http://localhost:3000 и переходите на `/en` или `/ru`.

Основной UI находится в `src/app/[locale]/page.tsx`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Стек

— Next.js 15 (App Router, Turbopack)
— Tailwind v4 (preflight)
— next-intl (i18n EN/RU)
— wagmi + RainbowKit
— TanStack Query

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## TODO

— Интегрировать реальный провайдер ассетов (DeBank/Alchemy)
— Реализовать безопасные транзакции очистки (ERC20/ERC721)
— Добавить SEO JSON-LD и FAQ для AEO
— Улучшить детекцию скама (фильтры по токен-скорам)

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

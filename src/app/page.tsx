"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Landing() {
  const [currentLocale, setCurrentLocale] = useState<"en" | "ru">("en");

  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const locale = browserLang.startsWith("ru") ? "ru" : "en";
    setCurrentLocale(locale);
  }, []);

  const content = {
    en: {
      hero: {
        title: "Clean Your Wallet from Scam Tokens & NFTs",
        subtitle:
          "One-click removal across EVM chains. Simple, transparent, and secure. No more spam cluttering your wallet.",
        cta: "Get Started Free",
        learnMore: "Learn More",
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "Three simple steps to a clean wallet",
        step1: {
          title: "1. Connect",
          desc: "Securely connect your wallet via WalletConnect or RainbowKit. Your keys never leave your device.",
        },
        step2: {
          title: "2. Review",
          desc: "Our AI detects suspicious tokens and NFTs. You have full control—choose what to remove.",
        },
        step3: {
          title: "3. Clean",
          desc: "Confirm the transaction and send unwanted assets away in a single flow. Done in seconds.",
        },
      },
      features: {
        title: "Why Wallet Cleaner?",
        feature1: {
          title: "🔗 Multi-Chain Support",
          desc: "Works on Ethereum, Base, Arbitrum, Optimism, Polygon, and more EVM chains.",
        },
        feature2: {
          title: "🔒 100% Secure",
          desc: "You sign all transactions. We never access your private keys or funds.",
        },
        feature3: {
          title: "⚡ Lightning Fast",
          desc: "Clean hundreds of tokens in one transaction. Save time and gas fees.",
        },
        feature4: {
          title: "🌍 International",
          desc: "Available in multiple languages with SEO-optimized content.",
        },
        feature5: {
          title: "💎 Pay What You Want",
          desc: "100% free to use. Optional tips to support development.",
        },
        feature6: {
          title: "🤖 AI-Powered Detection",
          desc: "Smart algorithms identify scam tokens and low-value assets automatically.",
        },
      },
      social: {
        title: "Trusted by Crypto Users Worldwide",
        stat1: "100+ Wallets Cleaned",
        stat2: "Multi-Chain Support",
        stat3: "Open Source",
      },
      donation: {
        title: "Support the Project",
        subtitle:
          "Wallet Cleaner is free and always will be. If you find it useful, consider supporting development with a voluntary donation.",
        benefit1: "✨ Help us add more chains",
        benefit2: "🚀 Improve AI detection",
        benefit3: "🌟 Keep it free for everyone",
        cta: "Try It Now & Donate",
        note: "You can add a tip after cleaning your wallet",
      },
      faq: {
        title: "Frequently Asked Questions",
        q1: {
          q: "Is it safe?",
          a: "Yes, absolutely. You sign all transactions in your own wallet. We never have access to your private keys or funds.",
        },
        q2: {
          q: "What is a scam token?",
          a: "Tokens with near-zero value, suspicious liquidity, or flagged by our detection algorithms. You always have final control.",
        },
        q3: {
          q: "Can I keep some tokens?",
          a: "Of course! Just uncheck the tokens you want to keep before confirming the transaction.",
        },
        q4: {
          q: "How much does it cost?",
          a: "It's completely free! You only pay network gas fees. Optional tips are appreciated to support development.",
        },
      },
      footer: {
        cta: "Ready to Clean Your Wallet?",
        button: "Get Started Now",
      },
    },
    ru: {
      hero: {
        title: "Очистите кошелёк от скам-токенов и NFT",
        subtitle:
          "Удаление в один клик по всем EVM-сетям. Просто, прозрачно и безопасно. Больше никакого спама в кошельке.",
        cta: "Начать бесплатно",
        learnMore: "Узнать больше",
      },
      howItWorks: {
        title: "Как это работает",
        subtitle: "Три простых шага к чистому кошельку",
        step1: {
          title: "1. Подключение",
          desc: "Безопасно подключите кошелёк через WalletConnect или RainbowKit. Ваши ключи не покидают устройство.",
        },
        step2: {
          title: "2. Проверка",
          desc: "Наш ИИ обнаруживает подозрительные токены и NFT. Полный контроль—выбирайте, что удалить.",
        },
        step3: {
          title: "3. Очистка",
          desc: "Подтвердите транзакцию и отправьте ненужные активы одной транзакцией. Готово за секунды.",
        },
      },
      features: {
        title: "Почему Wallet Cleaner?",
        feature1: {
          title: "🔗 Мультичейн",
          desc: "Работает в Ethereum, Base, Arbitrum, Optimism, Polygon и других EVM-сетях.",
        },
        feature2: {
          title: "🔒 100% безопасно",
          desc: "Вы подписываете все транзакции. Мы никогда не имеем доступа к вашим ключам или средствам.",
        },
        feature3: {
          title: "⚡ Молниеносно",
          desc: "Очистите сотни токенов одной транзакцией. Экономьте время и газ.",
        },
        feature4: {
          title: "🌍 Международный",
          desc: "Доступен на многих языках с SEO-оптимизированным контентом.",
        },
        feature5: {
          title: "💎 Платите сколько хотите",
          desc: "100% бесплатно. Необязательные чаевые для поддержки разработки.",
        },
        feature6: {
          title: "🤖 ИИ-детекция",
          desc: "Умные алгоритмы автоматически находят скам-токены и малоценные активы.",
        },
      },
      social: {
        title: "Доверяют криптопользователи по всему миру",
        stat1: "100+ очищенных кошельков",
        stat2: "Поддержка множества сетей",
        stat3: "Открытый исходный код",
      },
      donation: {
        title: "Поддержите проект",
        subtitle:
          "Wallet Cleaner бесплатен и всегда будет таким. Если он полезен для вас, поддержите разработку добровольным пожертвованием.",
        benefit1: "✨ Помогите добавить больше сетей",
        benefit2: "🚀 Улучшите ИИ-детекцию",
        benefit3: "🌟 Оставьте его бесплатным для всех",
        cta: "Попробовать и поддержать",
        note: "Вы сможете добавить чаевые после очистки",
      },
      faq: {
        title: "Частые вопросы",
        q1: {
          q: "Это безопасно?",
          a: "Да, абсолютно. Вы подписываете все транзакции в своём кошельке. Мы никогда не имеем доступа к вашим приватным ключам или средствам.",
        },
        q2: {
          q: "Что такое скам-токен?",
          a: "Токены с почти нулевой стоимостью, подозрительной ликвидностью или помеченные нашими алгоритмами. У вас всегда финальный контроль.",
        },
        q3: {
          q: "Можно ли оставить некоторые токены?",
          a: "Конечно! Просто снимите галочки с токенов, которые хотите оставить, перед подтверждением транзакции.",
        },
        q4: {
          q: "Сколько это стоит?",
          a: "Полностью бесплатно! Вы платите только сетевой газ. Необязательные чаевые приветствуются для поддержки разработки.",
        },
      },
      footer: {
        cta: "Готовы очистить кошелёк?",
        button: "Начать сейчас",
      },
    },
  };

  const t = content[currentLocale];

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-50 flex gap-2">
        <button
          onClick={() => setCurrentLocale("en")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentLocale === "en"
              ? "bg-white text-black"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setCurrentLocale("ru")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentLocale === "ru"
              ? "bg-white text-black"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          RU
        </button>
      </div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30 rounded-full text-sm">
          ✨ {currentLocale === "en" ? "Free Forever" : "Бесплатно навсегда"}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
          {t.hero.title}
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed">
          {t.hero.subtitle}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href={`/${currentLocale}`}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-indigo-500/50"
          >
            {t.hero.cta}
            <span className="ml-2 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
          <a
            href="#how"
            className="px-8 py-4 text-lg font-semibold border border-white/20 rounded-xl hover:bg-white/5 transition-all"
          >
            {t.hero.learnMore}
          </a>
        </div>
      </section>

      {/* Social Proof */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              {t.social.stat1}
            </div>
            <div className="text-white/60 text-sm">{t.social.title}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              5+
            </div>
            <div className="text-white/60 text-sm">{t.social.stat2}</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              ⭐
            </div>
            <div className="text-white/60 text-sm">{t.social.stat3}</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-white/60 text-lg">{t.howItWorks.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-2xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-semibold mb-3 mt-4">
              {t.howItWorks.step1.title}
            </h3>
            <p className="text-white/70 leading-relaxed">
              {t.howItWorks.step1.desc}
            </p>
          </div>
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-fuchsia-500/50 transition-all group">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-indigo-500 rounded-xl flex items-center justify-center text-2xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-semibold mb-3 mt-4">
              {t.howItWorks.step2.title}
            </h3>
            <p className="text-white/70 leading-relaxed">
              {t.howItWorks.step2.desc}
            </p>
          </div>
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-2xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-semibold mb-3 mt-4">
              {t.howItWorks.step3.title}
            </h3>
            <p className="text-white/70 leading-relaxed">
              {t.howItWorks.step3.desc}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t.features.title}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            t.features.feature1,
            t.features.feature2,
            t.features.feature3,
            t.features.feature4,
            t.features.feature5,
            t.features.feature6,
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all"
            >
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Donation CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden p-12 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-indigo-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="relative z-10 text-center">
            <div className="text-5xl mb-6">💖</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.donation.title}
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              {t.donation.subtitle}
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-8 text-left max-w-2xl mx-auto">
              <div className="text-white/80">{t.donation.benefit1}</div>
              <div className="text-white/80">{t.donation.benefit2}</div>
              <div className="text-white/80">{t.donation.benefit3}</div>
            </div>
            <Link
              href={`/${currentLocale}`}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-lg"
            >
              {t.donation.cta}
            </Link>
            <p className="text-white/50 text-sm mt-4">{t.donation.note}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.faq.title}</h2>
        </div>
        <div className="space-y-6">
          {[t.faq.q1, t.faq.q2, t.faq.q3, t.faq.q4].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <h3 className="text-xl font-semibold mb-3">{item.q}</h3>
              <p className="text-white/70 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">{t.footer.cta}</h2>
        <Link
          href={`/${currentLocale}`}
          className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-indigo-500/50"
        >
          {t.footer.button}
          <span className="ml-2">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-white/50 text-sm">
          <p>
            © 2025 Wallet Cleaner.{" "}
            {currentLocale === "en"
              ? "Made with ❤️ for the crypto community"
              : "Создано с ❤️ для крипто-сообщества"}
          </p>
        </div>
      </footer>
    </main>
  );
}

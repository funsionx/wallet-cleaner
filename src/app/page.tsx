import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Clean your wallet from scam tokens and NFTs
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto mb-10">
          One-click removal across EVM chains. Simple, transparent and secure.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/en"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90"
          >
            Open in English
          </Link>
          <Link
            href="/ru"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:opacity-90"
          >
            Открыть на русском
          </Link>
          <a
            href="#how"
            className="rounded-xl px-6 py-3 text-sm font-semibold border border-white/20 hover:bg-white/5"
          >
            Learn more
          </a>
        </div>
      </section>

      <section
        id="how"
        className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-2">Connect</h3>
          <p className="text-white/70 text-sm">
            Connect your wallet securely via WalletConnect/RainbowKit.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-2">Review</h3>
          <p className="text-white/70 text-sm">
            We detect suspicious assets. You choose what to keep.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-2">Clean</h3>
          <p className="text-white/70 text-sm">
            Send selected assets away in a single flow. Done.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-2">Why Wallet Cleaner</h3>
          <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">
            <li>
              Multi-chain support (Ethereum, Base, Arbitrum, Optimism, Polygon)
            </li>
            <li>Pricing transparency and optional tip</li>
            <li>SEO-friendly, i18n, dark UI</li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-2">FAQ</h3>
          <ul className="text-white/70 text-sm space-y-2">
            <li>Is it safe? You sign all transactions in your wallet.</li>
            <li>
              What is a scam token? Tokens with near-zero value or flagged by
              heuristics.
            </li>
            <li>Can I keep some assets? Yes, uncheck them before sending.</li>
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/en"
            className="inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90"
          >
            Get started (EN)
          </Link>
          <Link
            href="/ru"
            className="inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:opacity-90"
          >
            Начать (RU)
          </Link>
        </div>
      </section>
    </main>
  );
}

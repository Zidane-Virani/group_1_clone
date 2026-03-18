import Link from "next/link";

const featuredLinks = [
  {
    href: "/auction",
    eyebrow: "Live now",
    title: "Browse Auctions",
    description: "See active listings, track bids, and place your next offer.",
  },
  {
    href: "/items",
    eyebrow: "Catalog",
    title: "View Items",
    description: "Explore prize details, images, and current prices.",
  },
  {
    href: "/account",
    eyebrow: "Account",
    title: "My Profile",
    description: "Check your balance, sign in, and manage your session.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7d6,_#f5efe0_45%,_#eadfc8)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12 lg:px-10">
        <section className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/85 shadow-[0_24px_80px_rgba(120,98,47,0.12)] backdrop-blur">
          <div className="grid gap-10 px-8 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-12 md:py-14">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
                Kogbucks Auction Site
              </p>
              <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
                Bid on rewards using your Kogbucks balance.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-stone-600">
                Follow live auctions, watch the latest prices, and compete for featured items.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/auction"
                  className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
                >
                  Enter Auction
                </Link>
                <Link
                  href="/items"
                  className="rounded-full border border-stone-900/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-900"
                >
                  View Items
                </Link>
              </div>
            </div>

            <div className="grid gap-4 self-start rounded-[1.75rem] bg-stone-900 p-6 text-stone-50 shadow-[0_18px_50px_rgba(32,26,14,0.18)]">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Featured</p>
                <p className="mt-3 font-serif text-3xl">Quarterly rewards auction</p>
              </div>
              <div className="grid gap-3 text-sm text-stone-300">
                <p>Live bidding</p>
                <p>Current prices</p>
                <p>Item gallery</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {featuredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-[1.75rem] border border-stone-900/10 bg-white/88 p-6 shadow-[0_18px_50px_rgba(120,98,47,0.10)] transition-transform duration-200 hover:-translate-y-1"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
                {link.eyebrow}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-stone-900">
                {link.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-stone-600">
                {link.description}
              </p>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-stone-900">
                Open
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

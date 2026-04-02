import type { Metadata } from "next";
import Link from "next/link";
import RealEstateCTA from "@/components/leads/RealEstateCTA";

export const metadata: Metadata = {
  title: "Contact Sabrina | OttawaHoods",
  description:
    "Get in touch with Sabrina through OttawaHoods for help buying, selling, or investing in Ottawa real estate.",
};

const quickLinks = [
  { href: "/most-affordable", label: "Most Affordable" },
  { href: "/dangerous-neighbourhoods", label: "Most Dangerous" },
  { href: "/most-walkable", label: "Most Walkable" },
  { href: "/best-schools", label: "Best Schools" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 px-4 py-2"
          >
            <span className="text-lg font-bold text-white">OttawaHoods</span>
          </Link>

          <Link
            href="/dangerous-neighbourhoods"
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            View Lists
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
              Contact
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Talk to a local Ottawa real estate agent
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
              Use the form to ask about buying, selling, investing, or narrowing
              down the right neighbourhood. If you have a few areas in mind,
              include them in your message and Sabrina can follow up with
              relevant advice.
            </p>

            <div className="mt-8 rounded-2xl bg-rose-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">
                Popular Pages
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-rose-200 hover:text-rose-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <RealEstateCTA />
          </div>
        </section>
      </main>
    </div>
  );
}

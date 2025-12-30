import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Richest Neighbourhoods in Ottawa 2025 | Highest Income Areas",
  description: "Discover the wealthiest neighbourhoods in Ottawa ranked by median household income. View 2021 Census data for 100+ areas to find Ottawa's most affluent communities.",
  openGraph: {
    title: "Richest Neighbourhoods in Ottawa 2025",
    description: "Discover the wealthiest neighbourhoods in Ottawa ranked by median household income.",
    url: "https://ottawahoods.com/richest-neighbourhoods",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

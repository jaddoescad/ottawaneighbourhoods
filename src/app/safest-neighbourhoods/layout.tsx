import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safest Neighbourhoods in Ottawa 2025 | Low Crime Areas",
  description: "Discover the safest neighbourhoods in Ottawa with the lowest crime rates. Data-driven rankings based on 2024 police statistics, collision data, and safety metrics.",
  openGraph: {
    title: "Safest Neighbourhoods in Ottawa 2025 | Low Crime Areas",
    description: "Discover the safest neighbourhoods in Ottawa with the lowest crime rates based on 2024 data.",
    url: "https://ottawahoods.com/safest-neighbourhoods",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

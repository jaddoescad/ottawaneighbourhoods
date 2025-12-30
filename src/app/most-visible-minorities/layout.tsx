import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neighbourhoods with Most Visible Minorities in Ottawa 2025 | Diverse Areas",
  description: "Find Ottawa neighbourhoods with the highest visible minority populations. View 2021 Census data showing percentage of racialized residents across 100+ areas.",
  openGraph: {
    title: "Neighbourhoods with Most Visible Minorities in Ottawa 2025",
    description: "Find Ottawa neighbourhoods with the highest visible minority populations based on 2021 Census data.",
    url: "https://ottawahoods.com/most-visible-minorities",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

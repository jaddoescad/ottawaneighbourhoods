import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Ottawa Neighbourhoods for Families 2025 | Family-Friendly Areas",
  description: "Find the best family-friendly neighbourhoods in Ottawa. Rankings based on school quality, safety, parks, and community amenities for raising children.",
  openGraph: {
    title: "Best Ottawa Neighbourhoods for Families 2025",
    description: "Find the best family-friendly neighbourhoods in Ottawa based on schools, safety, and parks.",
    url: "https://ottawahoods.com/best-for-families",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Ottawa Neighbourhoods for Biking 2025 | Bike Score Rankings",
  description: "Find the best neighbourhoods for cycling in Ottawa. Rankings based on Bike Score measuring bike lanes, trails, and cycling infrastructure.",
  openGraph: {
    title: "Best Ottawa Neighbourhoods for Biking 2025",
    description: "Find the best neighbourhoods for cycling in Ottawa.",
    url: "https://ottawahoods.com/best-for-biking",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

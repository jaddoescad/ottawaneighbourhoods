import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Food Scene in Ottawa by Neighbourhood 2025 | Restaurants & Dining",
  description: "Find Ottawa neighbourhoods with the best food scene. Rankings based on restaurant density, dining variety, and culinary options.",
  openGraph: {
    title: "Best Food Scene in Ottawa by Neighbourhood 2025",
    description: "Find Ottawa neighbourhoods with the best restaurants and dining.",
    url: "https://ottawahoods.com/best-food-scene",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

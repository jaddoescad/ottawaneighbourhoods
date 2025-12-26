import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Ottawa Neighbourhoods for Young Professionals 2025",
  description: "Find the best neighbourhoods for young professionals in Ottawa. Rankings based on transit, walkability, nightlife, restaurants, and urban amenities.",
  openGraph: {
    title: "Best Ottawa Neighbourhoods for Young Professionals 2025",
    description: "Find the best neighbourhoods for young professionals in Ottawa.",
    url: "https://ottawahoods.com/best-for-young-professionals",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

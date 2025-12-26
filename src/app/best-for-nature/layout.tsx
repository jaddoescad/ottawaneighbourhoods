import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Ottawa Neighbourhoods for Nature 2025 | Trails & Green Spaces",
  description: "Find the best neighbourhoods for nature lovers in Ottawa. Rankings based on trails, green spaces, cycling paths, and outdoor recreation access.",
  openGraph: {
    title: "Best Ottawa Neighbourhoods for Nature 2025",
    description: "Find the best neighbourhoods for nature lovers in Ottawa.",
    url: "https://ottawahoods.com/best-for-nature",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

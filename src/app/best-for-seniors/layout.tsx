import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Ottawa Neighbourhoods for Seniors 2025 | Retirement Living",
  description: "Find the best neighbourhoods for seniors in Ottawa. Rankings based on hospital proximity, safety, walkability, and transit access for retirees.",
  openGraph: {
    title: "Best Ottawa Neighbourhoods for Seniors 2025",
    description: "Find the best neighbourhoods for seniors and retirees in Ottawa.",
    url: "https://ottawahoods.com/best-for-seniors",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Highest Density Neighbourhoods in Ottawa 2025 | Urban Living",
  description: "Find the highest density neighbourhoods in Ottawa. Rankings based on population per square kilometer for urban living preferences.",
  openGraph: {
    title: "Highest Density Neighbourhoods in Ottawa 2025",
    description: "Find the highest density neighbourhoods in Ottawa for urban living.",
    url: "https://ottawahoods.com/highest-density",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

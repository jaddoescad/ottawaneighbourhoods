import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Most Expensive Neighbourhoods in Ottawa 2025 | Luxury Areas",
  description: "Find the most expensive neighbourhoods in Ottawa. Rankings based on average rent and home prices for luxury and upscale living.",
  openGraph: {
    title: "Most Expensive Neighbourhoods in Ottawa 2025",
    description: "Find the most expensive neighbourhoods in Ottawa for luxury living.",
    url: "https://ottawahoods.com/most-expensive",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ottawa Neighbourhoods Closest to Hospitals 2025 | Healthcare Access",
  description: "Find Ottawa neighbourhoods closest to hospitals. Rankings based on distance to emergency rooms and healthcare facilities.",
  openGraph: {
    title: "Ottawa Neighbourhoods Closest to Hospitals 2025",
    description: "Find Ottawa neighbourhoods closest to hospitals and healthcare.",
    url: "https://ottawahoods.com/closest-hospitals",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

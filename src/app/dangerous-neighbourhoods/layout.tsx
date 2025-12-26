import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Most Dangerous Neighbourhoods in Ottawa 2025 | Crime Rankings",
  description: "See which Ottawa neighbourhoods have the highest crime rates. Data-driven rankings based on 2024 police statistics including violent crime, property crime, and more.",
  openGraph: {
    title: "Most Dangerous Neighbourhoods in Ottawa 2025 | Crime Rankings",
    description: "See which Ottawa neighbourhoods have the highest crime rates. Data-driven rankings based on 2024 police statistics.",
    url: "https://ottawahoods.com/dangerous-neighbourhoods",
    siteName: "OttawaHoods",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Ottawa Dangerous Neighbourhoods Crime Rankings",
      },
    ],
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Most Dangerous Neighbourhoods in Ottawa 2025",
    description: "See which Ottawa neighbourhoods have the highest crime rates based on 2024 police data.",
    images: ["/og-home.jpg"],
  },
};

export default function DangerousNeighbourhoodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

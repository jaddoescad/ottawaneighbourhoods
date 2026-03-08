import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lowest Density Neighbourhoods in Ottawa 2026 | Spacious Living",
  description: "Find the lowest density neighbourhoods in Ottawa. Rankings based on population per square kilometer for spacious suburban and rural living.",
  openGraph: {
    title: "Lowest Density Neighbourhoods in Ottawa 2026",
    description: "Find the lowest density neighbourhoods in Ottawa for spacious living.",
    url: "https://ottawahoods.com/lowest-density",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

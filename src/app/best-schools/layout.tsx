import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Schools in Ottawa by Neighbourhood 2025 | Top EQAO Scores",
  description: "Find Ottawa neighbourhoods with the best schools. Rankings based on EQAO test scores and school availability for elementary and secondary education.",
  openGraph: {
    title: "Best Schools in Ottawa by Neighbourhood 2025",
    description: "Find Ottawa neighbourhoods with the best schools based on EQAO scores.",
    url: "https://ottawahoods.com/best-schools",
    siteName: "OttawaHoods",
    locale: "en_CA",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

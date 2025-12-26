import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best High Schools in Ottawa by Neighbourhood | OttawaHoods",
  description: "Find the best Ottawa neighbourhoods for high schools. Rankings based on EQAO test scores for Grade 9 Math and OSSLT. Compare secondary school quality across all Ottawa areas.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

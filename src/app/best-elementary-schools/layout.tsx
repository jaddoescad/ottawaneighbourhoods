import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best Elementary Schools in Ottawa by Neighbourhood | OttawaHoods",
  description: "Find the best Ottawa neighbourhoods for elementary schools. Rankings based on EQAO test scores for Grades 3 & 6. Compare school quality across all Ottawa areas.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

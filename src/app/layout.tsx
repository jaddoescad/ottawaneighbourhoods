import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://ottawahoods.com";

export const metadata: Metadata = {
  title: "Top Ottawa Neighborhoods to Live In 2025 | OttawaHoods",
  description: "Compare the top Ottawa neighborhoods using real data. Crime stats, school scores, walk scores, rent prices, and more for 35+ areas. Find your perfect neighbourhood.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Top Ottawa Neighbourhoods Ranked | OttawaHoods",
    description: "Compare 37+ Ottawa neighbourhoods with real data: crime stats, school scores, walk scores, rent prices & more. Find your perfect area to live.",
    url: BASE_URL,
    siteName: "OttawaHoods",
    images: [
      {
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Ottawa Neighbourhoods Rankings - Compare the best areas to live",
      },
    ],
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Ottawa Neighbourhoods Ranked | OttawaHoods",
    description: "Compare 37+ Ottawa neighbourhoods with real data: crime, schools, walkability, rent & more.",
    images: ["/og-home.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BCVPNFYQE5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BCVPNFYQE5');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uo2hteiv6p");
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

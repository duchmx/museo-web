import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond, Jost } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "Museo de la Canción Yucateca",
  description: "Preservar el alma musical de Yucatán y encenderla en cada nueva generación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${garamond.variable} ${jost.variable}`}>
      <body style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}>{children}</body>
    </html>
  );
}

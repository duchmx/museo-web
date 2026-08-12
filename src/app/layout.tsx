import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond, Jost } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";

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
  // Sin metadataBase, Next no puede resolver URLs relativas de Open Graph.
  metadataBase: new URL(SITE_URL),
  title: "Museo de la Canción Yucateca",
  description: "Somos el espacio vivo donde el patrimonio musical de Yucatán se preserva, se cuenta y se hereda — cultivando en las nuevas generaciones la pasión por la canción que define nuestra identidad colectiva.",
  keywords: ["Museo de la Canción Yucateca", "Música Yucateca", "Canción Yucateca", "Patrimonio Musical", "Yucatán", "Música", "Canción"],
  authors: [{ name: "Museo de la Canción Yucateca" }],
  creator: "Museo de la Canción Yucateca",
  publisher: "Museo de la Canción Yucateca",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "Museo de la Canción Yucateca",
    title: "Museo de la Canción Yucateca",
    description: "Somos el espacio vivo donde el patrimonio musical de Yucatán se preserva, se cuenta y se hereda — cultivando en las nuevas generaciones la pasión por la canción que define nuestra identidad colectiva.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Museo de la Canción Yucateca",
    description: "Somos el espacio vivo donde el patrimonio musical de Yucatán se preserva, se cuenta y se hereda — cultivando en las nuevas generaciones la pasión por la canción que define nuestra identidad colectiva.",
    creator: "@MuseoCancionYuc",
    site: "@MuseoCancionYuc",
  },
  icons: {
    icon: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${garamond.variable} ${jost.variable}`}>
      <body style={{ fontFamily: "var(--font-garamond), Georgia, serif" }}>
        <Navigation />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

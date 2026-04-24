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
  description: "Somos el espacio vivo donde el patrimonio musical de Yucatán se preserva, se cuenta y se hereda — cultivando en las nuevas generaciones la pasión por la canción que define nuestra identidad colectiva.",
  keywords: ["Museo de la Canción Yucateca", "Música Yucateca", "Canción Yucateca", "Patrimonio Musical", "Yucatán", "Música", "Canción"],
  authors: [{ name: "Museo de la Canción Yucateca" }],
  creator: "Museo de la Canción Yucateca",
  publisher: "Museo de la Canción Yucateca",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://museodelacancionyucateca.mx",
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

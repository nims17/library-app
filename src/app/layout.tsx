import type { Metadata } from "next";
import { Playfair_Display, Caveat, Special_Elite } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Tabor Street Books",
  description: "A neighborhood library, for friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${playfair.variable} ${caveat.variable} ${specialElite.variable}`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans">
        <Nav />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}

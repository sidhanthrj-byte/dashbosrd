import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFab } from "@/components/WhatsAppFab";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-disp",
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-txt",
});

export const metadata: Metadata = {
  title: {
    default: "PONGS INDIA — German Textile Stretch Ceilings & Walls | DESCOR®",
    template: "%s | PONGS INDIA",
  },
  description:
    "Official channel partner of PONGS® Germany. DESCOR® seamless textile stretch ceilings & walls — acoustic, backlit and printed. 1,000+ projects, 6 experience centers across India.",
  keywords: [
    "stretch ceiling India",
    "DESCOR",
    "PONGS",
    "textile ceiling",
    "acoustic ceiling",
    "false ceiling alternative",
    "backlit ceiling",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}

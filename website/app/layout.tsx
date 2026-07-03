import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "PONGS India — German Textile Stretch Ceilings & Walls | DESCOR®",
    template: "%s | PONGS India",
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
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

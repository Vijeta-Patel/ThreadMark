import type { Metadata } from "next";
import { Fira_Code, Instrument_Serif, Roboto } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Roboto({ variable: "--font-sans-body", subsets: ["latin"], weight: ["400", "500", "900"] });
const serif = Instrument_Serif({ variable: "--font-serif-accent", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const mono = Fira_Code({ variable: "--font-mono-label", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ThreadMark",
  description: "Garment authentication with a blockchain-backed Digital Product Passport",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

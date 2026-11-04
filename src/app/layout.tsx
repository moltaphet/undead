import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Atmosphere } from "@/components/atmosphere";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const TAGLINE = "Your dead projects rise at midnight.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `Undead — ${TAGLINE}`, template: "%s · Undead" },
  description:
    "Paste an abandoned GitHub repo. Undead performs the autopsy, issues a death certificate, and plans the resurrection.",
};

export const viewport: Viewport = {
  themeColor: "#07080b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        <Atmosphere />
        {children}
      </body>
    </html>
  );
}

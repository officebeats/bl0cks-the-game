import type { Metadata } from "next";
import { Inter, Outfit, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-mono",
  subsets: ["latin"],
});

import GlobalAudio from "@/components/GlobalAudio";

export const metadata: Metadata = {
  title: "BL0CKS — The AI Strategy Card Game",
  description: "Experience the first strategy card game with a persistent AI-driven narrative world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${spaceMono.variable}`}>
      <body className="bg-pattern antialiased text-foreground">
        <GlobalAudio />
        {children}
      </body>
    </html>
  );
}

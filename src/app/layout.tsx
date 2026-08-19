import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeInit } from "@/components/ui/ThemeInit";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "La Chimère",
  description: "Site web du club La Chimère — programme, clés et communauté",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" data-theme="light" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter), system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}

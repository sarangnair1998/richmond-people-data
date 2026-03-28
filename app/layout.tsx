import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "RVA People Data",
  description:
    "Richmond City unified data portal — population, health, poverty, and education indicators from official government sources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {/* Persistent compliance banner */}
        <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800 font-medium">
          ⚠ Not for clinical use &nbsp;·&nbsp; Not an official City of Richmond publication &nbsp;·&nbsp; Data sourced from U.S. Census Bureau, VDH, and VDOE
        </div>
        {children}
      </body>
    </html>
  );
}

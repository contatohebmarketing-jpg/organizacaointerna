import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-serif",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "HEB · Planner",
  description: "Planner digital pessoal da Thallyta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <div className="min-h-screen p-3 md:p-5">
          <div className="mx-auto max-w-[1240px] flex gap-2">
            <Sidebar />
            <main className="flex-1 panel min-h-[calc(100vh-40px)] px-5 md:px-8 py-6 md:py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

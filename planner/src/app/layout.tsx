import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen p-3 md:p-5">
          <div className="mx-auto max-w-[1320px] flex gap-3">
            <Sidebar />
            <main className="flex-1 panel min-h-[calc(100vh-40px)] px-5 md:px-9 py-6 md:py-9">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

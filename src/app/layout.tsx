import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { GeistMono } from "geist/font/mono";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diagonally",
  description: "Interactive knowledge graph of math standards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${GeistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}

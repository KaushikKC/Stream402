import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { Navbar } from "@/components/navbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stream402 - Monetize Content with Solana Payments",
  description:
    "Stream402 - Upload and access images with Solana payments using the x402 protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <SolanaProvider>
          <Navbar />
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}

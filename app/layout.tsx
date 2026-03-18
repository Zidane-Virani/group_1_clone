import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kogbucks Auction Site",
  description: "Release 1 interface for accounts, auctions, items, and Kogbucks bidding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

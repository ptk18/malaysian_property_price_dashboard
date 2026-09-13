import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Property shortlist | Malaysian property demo",
  description:
    "Turn a buyer brief into an explainable property shortlist using Malaysian asking-price data.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

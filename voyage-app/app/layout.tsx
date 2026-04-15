import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "VAR — Trip Recap & Review",
  description: "Relive your trip, review your stays, share the story.",
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

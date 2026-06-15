import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linoria 相談予約",
  description: "Linoriaの相談予約ページです。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

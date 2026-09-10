import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BATH PRO / ROOM PRO 관리자",
  description: "호텔 현장 점검 및 조치 관리 백오피스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}

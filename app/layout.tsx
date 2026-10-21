import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drone Telemetry",
  description: "Dashboard telemetri drone ESP32: HTTP, MQTT, Supabase Realtime",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="flex gap-4 border-b border-line px-4 py-2 font-mono text-sm text-muted sm:px-6">
          <Link href="/" className="hover:text-foreground">Realtime</Link>
          <Link href="/mqtt" className="hover:text-foreground">MQTT</Link>
          <Link href="/compare" className="hover:text-foreground">Compare</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}

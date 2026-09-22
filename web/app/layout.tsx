import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Koby — Programmable business liquidity",
  description:
    "Koby turns future business cash flow into programmable liquidity: transparent financing terms, onchain settlement, and programmable repayment tracking.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('koby-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Theme init must run before first paint (no flash) but a <script>
            is not a valid direct child of <html> — React 19 rejects that
            with a hydration error. As the first child of <body> it is valid
            HTML: being inline and synchronous, it executes during parsing
            before the rest of the body renders. beforeInteractive keeps it
            in the initial document ahead of hydration. */}
        <Script
          id="koby-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Tight display face for the big headings and numbers.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Lean Tracker", template: "%s · Lean Tracker" },
  description: "Track calories, macros and weight on your weight loss journey.",
  appleWebApp: { capable: true, title: "Lean", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the tab bar sit above the iOS home indicator
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script sets data-theme before React hydrates.
    <html lang="en" className={`${inter.variable} ${interTight.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <ThemeProvider>
          <main className="mx-auto min-h-dvh w-full max-w-md px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-5">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}

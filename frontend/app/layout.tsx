import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import BackgroundAurora from "@/components/BackgroundAurora";
import PWARegister from "@/components/PWARegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#030712",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "NEXPLAY — One Account. Every Entertainment Destination.",
  description: "Unified Entertainment Platform & Discovery Hub connecting 40+ streaming, music, video, anime, and podcast services.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEXPLAY",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <PWARegister />

            {/* 3D Animated Ambient Streaming Aurora Background */}
            <BackgroundAurora />

            <Navbar />
            <div className="flex flex-1 max-w-7xl w-full mx-auto">
              <Sidebar />
              {/* pb-24 md:pb-8 ensures comfortable thumb spacing on mobile & Android devices above BottomNav */}
              <main className="flex-1 p-3 sm:p-5 lg:p-8 min-w-0 z-10 pb-24 md:pb-8">
                {children}
              </main>
            </div>

            {/* Mobile Bottom Navigation Bar (Smartphones, Android, iOS) */}
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

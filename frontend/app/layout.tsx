import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BackgroundAurora from "@/components/BackgroundAurora";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "NEXPLAY — One Account. Every Entertainment Destination.",
  description: "Unified Entertainment Platform & Discovery Hub connecting 40+ streaming, music, video, anime, and podcast services.",
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
            {/* 3D Animated Ambient Streaming Aurora Background */}
            <BackgroundAurora />

            <Navbar />
            <div className="flex flex-1 max-w-7xl w-full mx-auto">
              <Sidebar />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 z-10">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

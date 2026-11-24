import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { LocationProvider } from "@/hooks/useLocation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { LocationModal } from "@/components/location/LocationModal";
import { FoodloopAIChat } from "@/components/ai/FoodloopAIChat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FoodLoop — Save Food • Share Food • Feed Better",
  description: "Save Food. Share Food. Feed Better. Surplus food rescue connecting restaurants, bakeries, grocery stores, verified NGOs, and volunteers across India.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-freshBg text-freshText-primary flex flex-col font-sans antialiased selection:bg-lime selection:text-black pb-16 md:pb-0">
        <AuthProvider>
          <LocationProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <BottomNav />
            <LocationModal />
            <FoodloopAIChat />
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

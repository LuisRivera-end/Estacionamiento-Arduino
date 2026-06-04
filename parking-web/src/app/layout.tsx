import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GlobalColorModeToggle } from "@/components/GlobalColorModeToggle";
import { getPublicParkingName } from "@/lib/api/admin-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const parkingName = await getPublicParkingName();
  return {
    title: parkingName,
    description: `Dashboard operativo y pago de boletos para ${parkingName}`,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <GlobalColorModeToggle />
          {children}
        </Providers>
      </body>
    </html>
  );
}
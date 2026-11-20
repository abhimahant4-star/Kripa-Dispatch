import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Kirpa Truck Dispatch & Logistics — Admin",
  description: "Fleet, driver and dispatch management for Kirpa Truck Dispatch & Logistics.",
  icons: { icon: "/logo.jpeg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

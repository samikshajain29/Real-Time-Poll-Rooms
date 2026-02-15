// client/app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from "@/context/WebSocketContext"; // <-- Import the provider

// Configure the font
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'] 
});
export const metadata: Metadata = {
  title: "Live Poll Battle",
  description: "A real-time polling application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <WebSocketProvider> {/* <-- Wrap children with the provider */}
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
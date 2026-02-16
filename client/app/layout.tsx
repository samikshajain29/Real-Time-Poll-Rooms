// client/app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from "@/context/WebSocketContext";

// Configure the font
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});
export const metadata: Metadata = {
  title: "Real-Time Poll Rooms",
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
        <WebSocketProvider>{children}</WebSocketProvider>
      </body>
    </html>
  );
}

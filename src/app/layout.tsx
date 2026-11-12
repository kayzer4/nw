import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nightwatcher — Night Shift",
  description: "Keep the neighborhood safe until sunrise.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

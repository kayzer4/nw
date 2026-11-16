import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lightkeeper — Ночная смена",
  description: "Освещай город разумно до рассвета.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" suppressHydrationWarning><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "The Council of Gujarat | Unity, Service, Progress", template: "%s | The Council of Gujarat" },
  description: "Serving KSI Jamaats across Gujarat since 1987 through education, housing, healthcare and community welfare.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import { IBM_Plex_Mono, Open_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollRestoration from "@/components/ScrollRestoration";
import ScrollToHash from "@/components/ScrollToHash";

const fontSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-app-serif",
  display: "swap",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-app-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "Digital Twin Framework for Industrial Asset Prognostics | NASA C-MAPSS FD001",
    template: "%s | Digital Twin Framework",
  },
  description:
    "Digital twin framework for industrial asset prognostics — uncertainty-aware RUL with quantile LSTM and SHAP explanations (FD001 demo).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ScrollRestoration />
        <ScrollToHash />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

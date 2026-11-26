import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { SiteProvider } from "@/components/SiteProvider";
import { Header } from "@/components/Header";
import { Loader } from "@/components/Loader";
import { ContactDialog } from "@/components/ContactDialog";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "Samana Studio — Immersive web design for premium brands",
  description:
    "Immersive websites with 3D, motion and sound, for premium brands that want to be remembered. Studio working worldwide. Start your project.",
};

export const viewport: Viewport = {
  themeColor: "#02050c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <SiteProvider>
          <a className="skip-link" href="#contact">
            Skip to contact
          </a>
          <Loader />
          <Header />
          <main className="site-main">{children}</main>
          <ContactDialog />
        </SiteProvider>
      </body>
    </html>
  );
}

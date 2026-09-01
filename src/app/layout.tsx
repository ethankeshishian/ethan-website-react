import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "../constants.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Providers from "../providers/Providers";
import MuiProvider from "../providers/MuiProvider";
import AppShell from "../providers/AppShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ethank.tech"),
  title: "Ethan Keshishian",
  description: "Ethan Keshishian",
};

// Set the theme class before first paint so dark-mode users get no white flash.
const themeScript = `try{var r=localStorage.getItem('persist:root');if(r){var t=JSON.parse(JSON.parse(r).colorTheme||'{}');if(t&&t.darkMode)document.documentElement.classList.add('theme-dark');}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.className}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>
          <MuiProvider>
            <AntdRegistry>
              <AppShell>{children}</AppShell>
            </AntdRegistry>
          </MuiProvider>
        </Providers>
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}

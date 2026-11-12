import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { PALETTES, customPaletteCss } from "@/lib/content";
import { CONTENT, FEATURES, GITHUB_USER } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap", weight: ["400", "600", "700", "800"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${GITHUB_USER.toLowerCase()}.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`),
  title: CONTENT.meta.title,
  description: CONTENT.meta.description,
  openGraph: {
    title: CONTENT.meta.ogTitle || CONTENT.meta.title,
    description: CONTENT.meta.ogDescription || CONTENT.meta.description,
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#06070d" };

/**
 * Runs before first paint, so nothing flashes:
 * - `?palette=sunset` previews another palette without changing the saved one;
 * - otherwise a visitor's own pick from the colour switcher is restored;
 * - the intro animation is armed once per visit (never in /admin or for reduced motion).
 */
const HEAD_SCRIPT = [
  "try{",
  "var d=document.documentElement;",
  `var ok=${JSON.stringify(PALETTES.map((p) => p.value))};`,
  'var admin=location.pathname.indexOf("/admin")>-1;',
  'var p=new URLSearchParams(location.search).get("palette");',
  `if(!p&&!admin&&${FEATURES.paletteSwitcher}){try{p=localStorage.getItem("visitor-palette")}catch(e){}}`,
  "if(ok.indexOf(p)>-1)d.dataset.palette=p;",
  `if(${FEATURES.intro}&&!admin&&!matchMedia("(prefers-reduced-motion: reduce)").matches){`,
  'var s=null;try{s=sessionStorage.getItem("intro-seen")}catch(e){}if(!s)d.dataset.intro="play"}',
  "}catch(e){}",
].join("");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-palette={CONTENT.theme?.palette ?? "ocean"}
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: customPaletteCss(CONTENT.theme?.custom) }} />
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

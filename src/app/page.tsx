import About from "@/components/About";
import Awards from "@/components/Awards";
import Background from "@/components/Background";
import CommandPalette from "@/components/CommandPalette";
import Competitions from "@/components/Competitions";
import Contact from "@/components/Contact";
import Cursor from "@/components/Cursor";
import Education from "@/components/Education";
import GitHubStats from "@/components/GitHubStats";
import Hero from "@/components/Hero";
import Icon from "@/components/Icons";
import Intro from "@/components/Intro";
import Marquee from "@/components/Marquee";
import Nav from "@/components/Nav";
import Now from "@/components/Now";
import PaletteSwitcher from "@/components/PaletteSwitcher";
import Projects from "@/components/Projects";
import Research from "@/components/Research";
import ScrollProgress from "@/components/ScrollProgress";
import Skills from "@/components/Skills";
import StatsStrip from "@/components/StatsStrip";
import Testimonials from "@/components/Testimonials";
import { ACTIVE_SECTIONS, CONTACT, FEATURES, GITHUB_USER, PROFILE } from "@/lib/site";

/** Section order matches SECTION_IDS in lib/content.ts, which also numbers them and orders the menu. */
export default function Home() {
  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      {FEATURES.intro && <Intro />}
      {FEATURES.scrollProgress && <ScrollProgress />}
      <Background />
      <Nav />
      <main className="relative">
        <Hero />
        <StatsStrip />
        <Marquee />
        <About />
        {ACTIVE_SECTIONS.includes("now") && <Now />}
        <Projects />
        {ACTIVE_SECTIONS.includes("github") && <GitHubStats />}
        <Research />
        <Competitions />
        <Education />
        <Skills />
        <Awards />
        {ACTIVE_SECTIONS.includes("testimonials") && <Testimonials />}
        <Contact />
      </main>
      {FEATURES.commandPalette && <CommandPalette />}
      {FEATURES.paletteSwitcher && <PaletteSwitcher />}
      {FEATURES.cursor && <Cursor />}
      <footer className="relative z-10 mt-10 border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-4 py-10 text-sm text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} <span className="text-fg">{PROFILE.first} {PROFILE.last}</span> ·{" "}
            {CONTACT.location.split(",").pop()?.trim()}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${GITHUB_USER}`}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 hover:border-white/30 hover:text-white"
            >
              <Icon name="github" size={17} />
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              aria-label="Email"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 hover:border-white/30 hover:text-white"
            >
              <Icon name="mail" size={17} />
            </a>
            <a
              href="#top"
              aria-label="Back to top"
              className="grid h-10 w-10 place-items-center rounded-full tint-1 text-white"
            >
              <Icon name="arrowUp" size={17} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

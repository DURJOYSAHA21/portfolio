/**
 * Every fact on the page is data in src/content/site.json. Edit it from /admin
 * (or by hand); this module only types it and derives the few computed values.
 */
import raw from "@/content/site.json";
import { DEFAULT_FEATURES, SECTION_IDS, paperTotals, type SiteContent } from "./content";

export type {
  Arena,
  Build,
  Edu,
  Honor,
  NowItem,
  Paper,
  ResearchBuild,
  SkillGroup,
  Stat,
  Testimonial,
} from "./content";

export const CONTENT = raw as SiteContent;

export const GITHUB_USER = CONTENT.contact.githubUser;

/** Plain `<a>`/`<img>` URLs do not get Next's basePath, so prefix them by hand. */
export const asset = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export const PROFILE = CONTENT.profile;

export const CONTACT = {
  ...CONTENT.contact,
  phoneHref: `tel:${CONTENT.contact.phone.replace(/[^\d+]/g, "")}`,
  github: `https://github.com/${GITHUB_USER}`,
};

export const SECTIONS = CONTENT.sections;
export const BUILDS = CONTENT.builds;
export const ARENAS = CONTENT.arenas;
export const RESEARCH_BUILDS = CONTENT.researchBuilds;
export const EDUCATION = CONTENT.education;
export const RESEARCH = CONTENT.research;
export const HONORS = CONTENT.honors;
export const CO_CURRICULAR = CONTENT.coCurricular;
export const SKILLS = CONTENT.skills;

/** Paper counts read off the list itself, so no tally is ever typed twice. */
export const PAPER_TOTALS = paperTotals(RESEARCH);

export const DISPLAY = CONTENT.display;

/** Switches for the creative extras (missing keys count as on). */
export const FEATURES = { ...DEFAULT_FEATURES, ...CONTENT.features };

export const NOW = CONTENT.now ?? { updated: "", intro: "", items: [] };
export const TESTIMONIALS = (CONTENT.testimonials ?? []).filter((t) => t.quote.trim());

/** Sections actually on the page: optional ones drop out when switched off or empty. */
export const ACTIVE_SECTIONS = SECTION_IDS.filter((id) => {
  if (!SECTIONS[id]) return false;
  if (id === "now") return FEATURES.now && NOW.items.length > 0;
  if (id === "github") return FEATURES.githubStats;
  if (id === "testimonials") return FEATURES.testimonials && TESTIMONIALS.length > 0;
  return true;
});

/** Sections listed in the top menu: the ones given a menu label, in page order. */
export const NAV_LINKS = ACTIVE_SECTIONS.filter((id) => SECTIONS[id].nav.trim()).map((id) => ({
  id,
  label: SECTIONS[id].nav,
}));

/** Plain-text version of a heading that may contain *gradient* markers. */
export const plain = (text: string) => text.replace(/\*/g, "");

/**
 * The shape of src/content/site.json — the single file the /admin dashboard edits.
 * The public site and the admin both import these types, so a field added here
 * is checked on both sides.
 */

export type SectionId =
  | "about"
  | "now"
  | "github"
  | "testimonials"
  | "education"
  | "skills"
  | "projects"
  | "competitions"
  | "research"
  | "honors"
  | "contact";

/** Page order — also the order of the top menu and the admin's section list. */
export const SECTION_IDS: SectionId[] = [
  "about",
  "now",
  "projects",
  "github",
  "research",
  "competitions",
  "education",
  "skills",
  "honors",
  "testimonials",
  "contact",
];

/** `nav` empty = the section is not listed in the top menu. */
export type SectionCopy = { nav: string; title: string; kicker: string };

export type Stat = {
  /** "papers" fills value and note from the research list automatically. */
  auto: "" | "papers";
  value: number;
  decimals: number;
  suffix: string;
  label: string;
  note: string;
};

export type Build = {
  title: string;
  /** GitHub repository name under the profile; empty when the code is not public. */
  repo: string;
  track: "course" | "personal";
  period: string;
  stack: string[];
  blurb: string;
  /** Optional cover picture (site path or URL); without one the card gets generated artwork. */
  image: string;
  /** Extra screenshots, shown in the project pop-up. */
  gallery: string[];
  /** Live demo / website link. */
  demo: string;
  /** Online certificate / verification page. */
  certificateLink: string;
  /** Uploaded certificate (image or PDF), shown in a viewer on the site. */
  certificate: string;
};

export type Arena = {
  event: string;
  kind: "hackathon" | "datathon" | "contest";
  title: string;
  year: string;
  repo: string;
  stack: string[];
  note: string;
  /** Live demo / deployed app ("" = none). */
  demo: string;
  /** Optional cover picture (site path or URL); without one the card gets generated artwork. */
  image: string;
  /** Online certificate / verification page. */
  certificateLink: string;
  /** Uploaded certificate (image or PDF), shown in a viewer on the site. */
  certificate: string;
};

export type ResearchBuild = {
  title: string;
  repo: string;
  label: string;
  stack: string[];
  note: string;
  /** Optional cover picture (site path or URL); without one the card gets generated artwork. */
  image: string;
  /** Online certificate / verification page. */
  certificateLink: string;
  /** Uploaded certificate (image or PDF), shown in a viewer on the site. */
  certificate: string;
};

export type Edu = {
  /** Short badge shown on the tile: BSc / HSC / SSC. */
  level: string;
  school: string;
  degree: string;
  period: string;
  board: string;
  resultLabel: string;
  result: string;
  points: string[];
  /** Online certificate / verification page. */
  certificateLink: string;
  /** Uploaded certificate (image or PDF), shown in a viewer on the site. */
  certificate: string;
};

export type Paper = {
  title: string;
  venue: string;
  status: string;
  year: string;
  link: string;
  note: string;
  /** Optional cover picture (site path or URL); without one the card gets generated artwork. */
  image: string;
  /** Online certificate / verification page. */
  certificateLink: string;
  /** Uploaded certificate (image or PDF), shown in a viewer on the site. */
  certificate: string;
};

export type Honor = {
  title: string;
  issuer: string;
  year: string;
  kind: "honor" | "certification";
  link: string;
  /** Optional cover picture (site path or URL); without one the card gets generated artwork. */
  image: string;
  /** Uploaded certificate (image or PDF), shown in a viewer on the site. */
  certificate: string;
};

export type SkillGroup = { label: string; items: string[] };

export type NowItem = { icon: string; label: string; text: string };

export type Testimonial = { quote: string; name: string; role: string; photo: string; link: string };

/** The creative extras — each one can be switched off from /admin → Extra features. */
export type Features = {
  intro: boolean;
  tilt: boolean;
  projectDetails: boolean;
  commandPalette: boolean;
  githubStats: boolean;
  flipHonors: boolean;
  now: boolean;
  scrollProgress: boolean;
  cursor: boolean;
  paletteSwitcher: boolean;
  testimonials: boolean;
};

export const DEFAULT_FEATURES: Features = {
  intro: true,
  tilt: true,
  projectDetails: true,
  commandPalette: true,
  githubStats: true,
  flipHonors: true,
  now: true,
  scrollProgress: true,
  cursor: true,
  paletteSwitcher: true,
  testimonials: true,
};

export type SiteContent = {
  meta: { title: string; description: string; ogTitle: string; ogDescription: string };
  profile: {
    first: string;
    last: string;
    photo: string;
    photoAlt: string;
    /** CSS object-position for the portrait crop, e.g. "58% 26%". */
    photoPosition: string;
    cv: string;
    role: string;
    status: string;
    /** Typed one after another under the name. */
    roles: string[];
    tagline: string;
  };
  contact: {
    githubUser: string;
    email: string;
    phone: string;
    location: string;
    timezone: string;
  };
  sections: Record<SectionId, SectionCopy>;
  stats: Stat[];
  about: {
    /** Wrap words in *asterisks* to highlight them in the accent colour. */
    headline: string;
    paragraphs: string[];
    tags: string[];
    facts: { label: string; value: string }[];
  };
  education: Edu[];
  skillsIntro: string;
  skills: SkillGroup[];
  builds: Build[];
  arenas: Arena[];
  researchSummary: string;
  research: Paper[];
  researchBuilds: ResearchBuild[];
  honors: Honor[];
  coCurricularTitle: string;
  coCurricular: { title: string; note: string; certificateLink: string; certificate: string }[];
  contactCopy: { headline: string; body: string; cvTitle: string };
  now: { updated: string; intro: string; items: NowItem[] };
  testimonials: Testimonial[];
  features: Features;
  /** How many items each long list shows before "Show all". */
  display: { projectsShown: number; papersShown: number; honorsShown: number };
  /** Colour palette; presets live in globals.css under [data-palette], "custom" uses `custom`. */
  theme: { palette: Palette; custom: CustomColors };
};

export type Palette = "ocean" | "aurora" | "sunset" | "emerald" | "custom";
/** a1 main accent, a2 second accent, a3 warm highlight, a4 third accent — all hex. */
export type CustomColors = { a1: string; a2: string; a3: string; a4: string };

export const PALETTES: { value: Palette; label: string; note: string; colors: string[] }[] = [
  { value: "ocean", label: "Ocean", note: "Blue, cyan & emerald", colors: ["#38bdf8", "#22d3ee", "#34d399", "#fbbf24"] },
  { value: "aurora", label: "Aurora", note: "Purple, cyan & pink", colors: ["#a78bfa", "#22d3ee", "#f472b6", "#fbbf24"] },
  { value: "sunset", label: "Sunset", note: "Orange, rose & gold", colors: ["#fb923c", "#fb7185", "#f472b6", "#facc15"] },
  { value: "emerald", label: "Emerald", note: "Green, teal & lime", colors: ["#34d399", "#22d3ee", "#2dd4bf", "#a3e635"] },
  { value: "custom", label: "Custom", note: "Your own four colours", colors: [] },
];

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

/**
 * CSS for the "custom" palette. The darker button shades and background glows
 * are mixed from these colours in globals.css, so four picks are enough.
 */
export function customPaletteCss(c: CustomColors | undefined) {
  if (!c) return "";
  const pick = (v: string, fallback: string) => (HEX.test(v) ? v : fallback);
  const a1 = pick(c.a1, "#38bdf8");
  const a2 = pick(c.a2, "#22d3ee");
  const a3 = pick(c.a3, "#fbbf24");
  const a4 = pick(c.a4, "#34d399");
  return `[data-palette="custom"]{--a1:${a1};--a1-rgb:${rgb(a1)};--a2:${a2};--a2-rgb:${rgb(a2)};--a3:${a3};--a4:${a4}}`;
}

/** A paper counts as decided unless its status says it is still under review. */
export const isUnderReview = (paper: Pick<Paper, "status">) =>
  !paper.status.trim() || /under review/i.test(paper.status);

export function paperTotals(papers: Paper[]) {
  const underReview = papers.filter(isUnderReview).length;
  return { submitted: papers.length, accepted: papers.length - underReview, underReview };
}

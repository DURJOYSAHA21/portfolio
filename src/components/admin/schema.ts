/**
 * What the dashboard shows. Each page is a stack of blocks; a block edits an
 * object ("fields") or an ordered array ("list") at a path inside site.json.
 * Adding a field to the site = add it to content.ts, site.json, and here.
 */
import { SECTION_IDS, type SiteContent } from "@/lib/content";
import { ICON_NAMES } from "../Icons";

export type Path = (string | number)[];

type Base = { key: string; label: string; hint?: string; wide?: boolean };

export type Field =
  | (Base & { type: "text" | "url"; placeholder?: string; suggestions?: string[] })
  | (Base & { type: "textarea"; rows?: number; placeholder?: string })
  | (Base & { type: "number"; step?: number })
  | (Base & { type: "select"; options: { value: string; label: string }[] })
  | (Base & { type: "tags"; placeholder?: string })
  | (Base & { type: "paragraphs"; itemLabel: string })
  | (Base & { type: "file"; accept: string; kind: "image" | "pdf" | "doc" })
  | (Base & { type: "palette" })
  | (Base & { type: "color" })
  | (Base & { type: "toggle" })
  | (Base & { type: "gallery" });

export type Block =
  | { kind: "fields"; title?: string; description?: string; path: Path; fields: Field[] }
  | {
      kind: "list";
      title: string;
      description?: string;
      path: Path;
      itemName: string;
      fields: Field[];
      summary: (item: Record<string, unknown>) => { title: string; meta?: string };
      blank: () => Record<string, unknown>;
    };

export type Page = {
  id: string;
  label: string;
  group: "content" | "site";
  icon: string;
  intro: string;
  blocks: Block[];
  /** Top-level content keys this page edits — used for "changed" dots and commit messages. */
  keys: (keyof SiteContent)[];
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Every entry can carry a certificate: an online link, an uploaded file, or both. */
const CERT_LINK: Field = {
  key: "certificateLink",
  label: "Certificate link",
  type: "url",
  placeholder: "https://…",
  hint: "Online certificate or verification page. Shows a “Certificate” button on the card.",
};
const CERT_FILE: Field = {
  key: "certificate",
  label: "Certificate file",
  type: "file",
  accept: "image/*,application/pdf",
  kind: "doc",
  wide: true,
  hint: "Upload the certificate (photo, scan or PDF). Visitors open it in a viewer on the site and can download it.",
};
const CERTS: Field[] = [CERT_LINK, CERT_FILE];

const HIGHLIGHT_HINT = "Wrap words in *asterisks* to highlight them in the accent colour.";
const REPO_HINT = "Repository name under your GitHub profile. Leave empty if the code is private.";

export const PAGES: Page[] = [
  {
    id: "profile",
    label: "Profile & hero",
    group: "content",
    icon: "◉",
    intro: "The first screen: status badge, your name, typed roles, tagline, photo and buttons.",
    keys: ["profile"],
    blocks: [
      {
        kind: "fields",
        title: "Identity",
        path: ["profile"],
        fields: [
          { key: "first", label: "First name", type: "text" },
          { key: "last", label: "Last name", type: "text" },
          {
            key: "status",
            label: "Status pill",
            type: "text",
            hint: "The badge with the green dot above your name. Empty hides it.",
          },
          {
            key: "roles",
            label: "Typed roles",
            type: "tags",
            wide: true,
            hint: "Typed one after another under your name, e.g. AI/ML Researcher.",
          },
          { key: "tagline", label: "Tagline", type: "textarea", rows: 3, wide: true },
          { key: "role", label: "Role line (used in search previews)", type: "text", wide: true },
        ],
      },
      {
        kind: "fields",
        title: "Photo & CV",
        description: "Uploads are committed together with your text on the next save.",
        path: ["profile"],
        fields: [
          { key: "photo", label: "Portrait", type: "file", accept: "image/*", kind: "image", wide: true },
          { key: "photoAlt", label: "Photo description (alt text)", type: "text" },
          {
            key: "photoPosition",
            label: "Photo focus point",
            type: "text",
            placeholder: "58% 26%",
            hint: "Horizontal% vertical% — which part of the photo stays in frame.",
          },
          { key: "cv", label: "CV (PDF)", type: "file", accept: "application/pdf", kind: "pdf", wide: true },
        ],
      },
    ],
  },
  {
    id: "stats",
    label: "Stats strip",
    group: "content",
    icon: "▤",
    intro: "The counters under the hero (they count up on screen). The first two also float beside your photo. Four fit best.",
    keys: ["stats"],
    blocks: [
      {
        kind: "list",
        title: "Counters",
        path: ["stats"],
        itemName: "stat",
        description: "Set Source to “papers” to count your research list automatically.",
        fields: [
          { key: "label", label: "Label", type: "text" },
          {
            key: "auto",
            label: "Source",
            type: "select",
            options: [
              { value: "", label: "typed by hand" },
              { value: "papers", label: "count papers automatically" },
            ],
          },
          { key: "value", label: "Number", type: "number", step: 0.01 },
          { key: "decimals", label: "Decimals shown", type: "number" },
          { key: "suffix", label: "Suffix", type: "text", placeholder: "+" },
          { key: "note", label: "Note", type: "text" },
        ],
        summary: (s) => ({
          title: str(s.label),
          meta: s.auto === "papers" ? "auto · papers" : `${s.value}${str(s.suffix)}`,
        }),
        blank: () => ({ auto: "", value: 0, decimals: 0, suffix: "", label: "New stat", note: "" }),
      },
    ],
  },
  {
    id: "about",
    label: "About",
    group: "content",
    icon: "✎",
    intro: "Your story, the quick facts beside it, and a few tags.",
    keys: ["about"],
    blocks: [
      {
        kind: "fields",
        title: "Story",
        path: ["about"],
        fields: [
          { key: "headline", label: "Headline", type: "textarea", rows: 2, hint: HIGHLIGHT_HINT, wide: true },
          { key: "paragraphs", label: "Paragraphs", type: "paragraphs", itemLabel: "paragraph", wide: true },
          { key: "tags", label: "Tags", type: "tags", wide: true },
        ],
      },
      {
        kind: "list",
        title: "Quick facts",
        path: ["about", "facts"],
        itemName: "fact",
        fields: [
          { key: "label", label: "Label", type: "text" },
          { key: "value", label: "Value", type: "text" },
        ],
        summary: (f) => ({ title: str(f.label), meta: str(f.value) }),
        blank: () => ({ label: "", value: "" }),
      },
    ],
  },
  {
    id: "now",
    label: "Now",
    group: "content",
    icon: "◷",
    intro:
      "A short “what I’m doing now” snapshot under About: what you are researching, building and learning this season. Update it every few months. Turn it off in Extra features.",
    keys: ["now"],
    blocks: [
      {
        kind: "fields",
        path: ["now"],
        fields: [
          {
            key: "updated",
            label: "Last updated",
            type: "text",
            placeholder: "November 2026",
            hint: "Shown as “Updated …” beside the live badge.",
          },
          { key: "intro", label: "Intro line (optional)", type: "textarea", rows: 2, wide: true },
        ],
      },
      {
        kind: "list",
        title: "Cards",
        description: "Four fit best on one row.",
        path: ["now", "items"],
        itemName: "card",
        fields: [
          { key: "label", label: "Label", type: "text", placeholder: "Learning" },
          {
            key: "icon",
            label: "Icon",
            type: "select",
            options: ICON_NAMES.map((name) => ({ value: name, label: name })),
          },
          { key: "text", label: "Text", type: "textarea", rows: 3, wide: true },
        ],
        summary: (n) => ({ title: str(n.label), meta: str(n.text).slice(0, 60) }),
        blank: () => ({ icon: "sparkles", label: "", text: "" }),
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    group: "content",
    icon: "◇",
    intro: "A timeline, newest first.",
    keys: ["education"],
    blocks: [
      {
        kind: "list",
        title: "Degrees & certificates",
        path: ["education"],
        itemName: "entry",
        fields: [
          { key: "level", label: "Badge", type: "text", placeholder: "BSc" },
          { key: "period", label: "Period", type: "text" },
          { key: "degree", label: "Degree", type: "text", wide: true },
          { key: "school", label: "Institution", type: "text", wide: true },
          { key: "board", label: "Board / city", type: "text" },
          { key: "resultLabel", label: "Result label", type: "text", placeholder: "CGPA" },
          { key: "result", label: "Result", type: "text", placeholder: "4.00 / 4.00" },
          { key: "points", label: "Points", type: "paragraphs", itemLabel: "point", wide: true },
          ...CERTS,
        ],
        summary: (e) => ({ title: `${str(e.level)} · ${str(e.degree)}`, meta: str(e.result) }),
        blank: () => ({
          level: "",
          school: "",
          degree: "",
          period: "",
          board: "",
          resultLabel: "GPA",
          result: "",
          points: [],
          certificateLink: "",
          certificate: "",
        }),
      },
    ],
  },
  {
    id: "skills",
    label: "Skills",
    group: "content",
    icon: "⚙",
    intro: "Skill groups, shown as cards. Every skill also scrolls in the marquee under the hero.",
    keys: ["skillsIntro", "skills"],
    blocks: [
      {
        kind: "fields",
        path: [],
        fields: [{ key: "skillsIntro", label: "Intro paragraph", type: "textarea", rows: 3, wide: true }],
      },
      {
        kind: "list",
        title: "Skill groups",
        path: ["skills"],
        itemName: "group",
        fields: [
          { key: "label", label: "Group name", type: "text", wide: true },
          { key: "items", label: "Skills", type: "tags", wide: true },
        ],
        summary: (g) => ({
          title: str(g.label),
          meta: `${Array.isArray(g.items) ? g.items.length : 0} skills`,
        }),
        blank: () => ({ label: "New group", items: [] }),
      },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    group: "content",
    icon: "▣",
    intro:
      "Shown as picture cards in this order — put your best work first. Upload a screenshot as the cover, or leave it empty for generated artwork. GitHub stars load live from the repo name.",
    keys: ["builds", "display"],
    blocks: [
      {
        kind: "list",
        title: "Builds",
        path: ["builds"],
        itemName: "project",
        fields: [
          { key: "title", label: "Title", type: "text" },
          {
            key: "track",
            label: "Type",
            type: "select",
            options: [
              { value: "course", label: "course project" },
              { value: "personal", label: "personal build" },
            ],
          },
          { key: "period", label: "Period", type: "text", placeholder: "Jan — Apr 2026" },
          { key: "repo", label: "GitHub repo", type: "text", hint: REPO_HINT },
          { key: "stack", label: "Stack", type: "tags", wide: true },
          {
            key: "blurb",
            label: "Description",
            type: "textarea",
            rows: 4,
            wide: true,
            hint: "The card shows the first few lines; the full text (blank lines = new paragraphs) shows in the project pop-up.",
          },
          {
            key: "demo",
            label: "Live demo link",
            type: "url",
            placeholder: "https://…",
            hint: "Shows a “Live demo” button in the project pop-up.",
          },
          {
            key: "image",
            label: "Cover image (optional)",
            type: "file",
            accept: "image/*",
            kind: "image",
            wide: true,
            hint: "A real screenshot, poster or photo. Leave empty and the card gets generated artwork.",
          },
          {
            key: "gallery",
            label: "More screenshots (pop-up gallery)",
            type: "gallery",
            wide: true,
            hint: "Shown as a slideshow when someone opens the project. Needs “Project pop-up” on in Extra features.",
          },
          ...CERTS,
        ],
        summary: (b) => ({ title: str(b.title), meta: `${str(b.track)}${b.period ? ` · ${b.period}` : ""}` }),
        blank: () => ({ title: "New project", repo: "", track: "personal", period: "", stack: [], blurb: "", demo: "", image: "", gallery: [], certificateLink: "", certificate: "" }),
      },
      {
        kind: "fields",
        title: "Layout",
        path: ["display"],
        fields: [
          {
            key: "projectsShown",
            label: "Projects shown before “Show all”",
            type: "number",
            hint: "0 shows everything.",
          },
        ],
      },
    ],
  },
  {
    id: "competitions",
    label: "Competitions",
    group: "content",
    icon: "⚑",
    intro: "Hackathons, datathons and contests, in this order.",
    keys: ["arenas"],
    blocks: [
      {
        kind: "list",
        title: "Hackathons, datathons & contests",
        path: ["arenas"],
        itemName: "competition",
        fields: [
          { key: "title", label: "Entry title", type: "text" },
          { key: "event", label: "Event", type: "text" },
          {
            key: "kind",
            label: "Kind",
            type: "select",
            options: [
              { value: "hackathon", label: "hackathon" },
              { value: "datathon", label: "datathon" },
              { value: "contest", label: "contest" },
            ],
          },
          { key: "year", label: "Year / date", type: "text" },
          { key: "repo", label: "GitHub repo", type: "text", hint: REPO_HINT },
          { key: "stack", label: "Stack", type: "tags" },
          { key: "note", label: "Description", type: "textarea", rows: 4, wide: true },
          { key: "demo", label: "Live demo link", type: "url", placeholder: "https://…", hint: "Shows a “Live demo” link on the card." },
          {
            key: "image",
            label: "Cover image (optional)",
            type: "file",
            accept: "image/*",
            kind: "image",
            wide: true,
            hint: "A real screenshot, poster or photo. Leave empty and the card gets generated artwork.",
          },
          ...CERTS,
        ],
        summary: (a) => ({ title: str(a.title), meta: `${str(a.kind)} · ${str(a.event)}` }),
        blank: () => ({ event: "", kind: "hackathon", title: "New competition", year: "", repo: "", stack: [], note: "", demo: "", image: "", certificateLink: "", certificate: "" }),
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    group: "content",
    icon: "✦",
    intro:
      "A paper counts as accepted unless its status says “under review” — the totals update themselves. Accepted papers get a highlighted badge.",
    keys: ["research", "researchBuilds", "researchSummary", "display"],
    blocks: [
      {
        kind: "fields",
        path: [],
        fields: [
          { key: "researchSummary", label: "Summary under the totals", type: "textarea", rows: 3, wide: true },
        ],
      },
      {
        kind: "list",
        title: "Papers",
        path: ["research"],
        itemName: "paper",
        fields: [
          { key: "title", label: "Title", type: "textarea", rows: 2, wide: true },
          { key: "venue", label: "Venue", type: "text" },
          { key: "year", label: "Year", type: "text" },
          {
            key: "status",
            label: "Status",
            type: "text",
            suggestions: ["under review", "Accepted · not yet published", "Published", "Conference paper presented", "Abstract published"],
          },
          { key: "link", label: "Paper link", type: "url", placeholder: "https://…" },
          { key: "note", label: "Description", type: "textarea", rows: 3, wide: true },
          {
            key: "image",
            label: "Cover image (optional)",
            type: "file",
            accept: "image/*",
            kind: "image",
            wide: true,
            hint: "A real screenshot, poster or photo. Leave empty and the card gets generated artwork.",
          },
          ...CERTS,
        ],
        summary: (p) => ({ title: str(p.title), meta: `${str(p.venue)} · ${str(p.status)}` }),
        blank: () => ({ title: "New paper", venue: "", status: "under review", year: "", link: "", note: "", image: "", certificateLink: "", certificate: "" }),
      },
      {
        kind: "list",
        title: "Research code",
        path: ["researchBuilds"],
        itemName: "repository",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "label", label: "Label", type: "text", placeholder: "the code behind paper 01" },
          { key: "repo", label: "GitHub repo", type: "text", wide: true },
          { key: "stack", label: "Stack", type: "tags", wide: true },
          { key: "note", label: "Description", type: "textarea", rows: 3, wide: true },
          {
            key: "image",
            label: "Cover image (optional)",
            type: "file",
            accept: "image/*",
            kind: "image",
            wide: true,
            hint: "A real screenshot, poster or photo. Leave empty and the card gets generated artwork.",
          },
          ...CERTS,
        ],
        summary: (b) => ({ title: str(b.title), meta: str(b.label) }),
        blank: () => ({ title: "", repo: "", label: "", stack: [], note: "", image: "", certificateLink: "", certificate: "" }),
      },
      {
        kind: "fields",
        title: "Layout",
        path: ["display"],
        fields: [
          { key: "papersShown", label: "Papers shown before “Show all”", type: "number", hint: "0 shows everything." },
        ],
      },
    ],
  },
  {
    id: "honors",
    label: "Honors & activities",
    group: "content",
    icon: "★",
    intro: "Awards, certifications and co-curricular work.",
    keys: ["honors", "coCurricular", "coCurricularTitle", "display"],
    blocks: [
      {
        kind: "list",
        title: "Honors & certifications",
        path: ["honors"],
        itemName: "honor",
        fields: [
          { key: "title", label: "Title", type: "text", wide: true },
          { key: "issuer", label: "Issuer", type: "text", wide: true },
          { key: "year", label: "Date", type: "text" },
          {
            key: "kind",
            label: "Kind",
            type: "select",
            options: [
              { value: "honor", label: "honor" },
              { value: "certification", label: "certification" },
            ],
          },
          {
            key: "link",
            label: "Certificate link",
            type: "url",
            placeholder: "https://…",
            wide: true,
            hint: "Online certificate or verification page.",
          },
          CERT_FILE,
          {
            key: "image",
            label: "Badge / logo image (optional)",
            type: "file",
            accept: "image/*",
            kind: "image",
            wide: true,
            hint: "Small square picture on the card. Leave empty to use the certificate photo, or an icon.",
          },
        ],
        summary: (h) => ({ title: str(h.title), meta: `${str(h.kind)} · ${str(h.year)}` }),
        blank: () => ({ title: "", issuer: "", year: "", kind: "certification", link: "", image: "", certificate: "" }),
      },
      {
        kind: "fields",
        path: [],
        fields: [{ key: "coCurricularTitle", label: "Activities heading", type: "text" }],
      },
      {
        kind: "list",
        title: "Co-curricular activities",
        path: ["coCurricular"],
        itemName: "activity",
        fields: [
          { key: "title", label: "Title", type: "text", wide: true },
          { key: "note", label: "Note", type: "text", wide: true },
          ...CERTS,
        ],
        summary: (c) => ({ title: str(c.title) }),
        blank: () => ({ title: "", note: "", certificateLink: "", certificate: "" }),
      },
      {
        kind: "fields",
        title: "Layout",
        path: ["display"],
        fields: [
          { key: "honorsShown", label: "Items shown before “Show all”", type: "number", hint: "0 shows everything." },
        ],
      },
    ],
  },
  {
    id: "testimonials",
    label: "Testimonials",
    group: "content",
    icon: "❝",
    intro:
      "Quotes from teachers, supervisors and teammates, shown before Contact. The section hides itself when the list is empty. Only use real quotes, with the person’s permission.",
    keys: ["testimonials"],
    blocks: [
      {
        kind: "list",
        title: "Quotes",
        path: ["testimonials"],
        itemName: "quote",
        fields: [
          { key: "quote", label: "Quote", type: "textarea", rows: 4, wide: true },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text", placeholder: "Thesis supervisor, AIUB" },
          { key: "link", label: "Profile link (optional)", type: "url", placeholder: "https://linkedin.com/in/…" },
          {
            key: "photo",
            label: "Photo (optional)",
            type: "file",
            accept: "image/*",
            kind: "image",
            wide: true,
            hint: "Small round picture. Leave empty to show their initials.",
          },
        ],
        summary: (t) => ({ title: str(t.name) || "(no name)", meta: str(t.role) }),
        blank: () => ({ quote: "", name: "", role: "", photo: "", link: "" }),
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    group: "content",
    icon: "✉",
    intro: "The closing section, plus the details used across the site.",
    keys: ["contact", "contactCopy"],
    blocks: [
      {
        kind: "fields",
        title: "Details",
        path: ["contact"],
        fields: [
          { key: "email", label: "Email", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "location", label: "Address", type: "text", wide: true },
          { key: "timezone", label: "Timezone line", type: "text" },
          {
            key: "githubUser",
            label: "GitHub username",
            type: "text",
            hint: "Used for repo links and the live star counts.",
          },
        ],
      },
      {
        kind: "fields",
        title: "Copy",
        path: ["contactCopy"],
        fields: [
          { key: "headline", label: "Headline", type: "textarea", rows: 2, hint: HIGHLIGHT_HINT, wide: true },
          { key: "body", label: "Body", type: "textarea", rows: 3, wide: true },
          { key: "cvTitle", label: "CV link text", type: "text" },
        ],
      },
    ],
  },
  {
    id: "sections",
    label: "Section titles & menu",
    group: "site",
    icon: "☰",
    intro:
      "Each section’s heading and subtitle, in page order. Wrap words in *asterisks* for the animated gradient. Give a section a menu label to list it in the top menu; leave it empty to keep the menu short.",
    keys: ["sections"],
    blocks: SECTION_IDS.map((id, i) => ({
      kind: "fields" as const,
      title: `${i + 1} · ${id}`,
      path: ["sections", id],
      fields: [
        { key: "title", label: "Heading", type: "text" as const, hint: "*word* = gradient" },
        { key: "nav", label: "Menu label", type: "text" as const, placeholder: "not in menu" },
        { key: "kicker", label: "Subtitle", type: "text" as const, wide: true },
      ],
    })),
  },
  {
    id: "theme",
    label: "Theme & colours",
    group: "site",
    icon: "◐",
    intro:
      "The colour palette of the whole site — background glows, buttons, gradients, card artwork and the particle network all follow it.",
    keys: ["theme"],
    blocks: [
      {
        kind: "fields",
        title: "Palette",
        description:
          "Click a palette — this dashboard switches to it straight away as a preview. “Preview” opens your site in that palette without saving. Publish to make it live.",
        path: ["theme"],
        fields: [{ key: "palette", label: "Choose a palette", type: "palette", wide: true }],
      },
      {
        kind: "fields",
        title: "Custom colours",
        description:
          "Used when the palette is “Custom”. Pick four colours; the darker button shades and background glows are mixed from them automatically. Bright colours work best on the dark background.",
        path: ["theme", "custom"],
        fields: [
          { key: "a1", label: "Main accent", type: "color", hint: "Name gradient, links, glows." },
          { key: "a2", label: "Second accent", type: "color", hint: "Typing caret, particles, highlights." },
          { key: "a3", label: "Warm highlight", type: "color", hint: "Contrast colour on covers and icons." },
          { key: "a4", label: "Third accent", type: "color", hint: "Gradient end, icon tints." },
        ],
      },
    ],
  },
  {
    id: "features",
    label: "Extra features",
    group: "site",
    icon: "✦",
    intro:
      "The creative extras. Try them all on your site, then switch off whatever you don’t like. Nothing is deleted, so you can turn any of them back on later. Publish to apply.",
    keys: ["features"],
    blocks: [
      {
        kind: "fields",
        title: "Animation & feel",
        path: ["features"],
        fields: [
          { key: "intro", label: "Intro animation", type: "toggle", hint: "Your name assembles on a short opening screen, once per visit. Click or press a key to skip." },
          { key: "tilt", label: "3D tilt cards", type: "toggle", hint: "Cards tilt toward the mouse with a light sheen (desktop only)." },
          { key: "cursor", label: "Cursor ring", type: "toggle", hint: "A soft ring follows the mouse and grows over buttons and links (desktop only)." },
          { key: "scrollProgress", label: "Scroll progress bar", type: "toggle", hint: "A glowing line along the top edge fills as visitors scroll." },
        ],
      },
      {
        kind: "fields",
        title: "Interactive tools",
        path: ["features"],
        fields: [
          { key: "projectDetails", label: "Project pop-up", type: "toggle", hint: "Clicking a project opens a full view: screenshot gallery, full description, stack and links." },
          { key: "commandPalette", label: "Search (Ctrl + K)", type: "toggle", hint: "A search box for every project, paper and section, plus quick actions. Opens with Ctrl+K, / or the search button." },
          { key: "paletteSwitcher", label: "Visitor colour switcher", type: "toggle", hint: "A small colour button (bottom-left) lets visitors try your palettes. Their pick stays in their own browser." },
          { key: "flipHonors", label: "Flip cards for honors", type: "toggle", hint: "Honor cards flip over to show the certificate photo." },
        ],
      },
      {
        kind: "fields",
        title: "Extra sections",
        path: ["features"],
        fields: [
          { key: "now", label: "“Now” section", type: "toggle", hint: "What you are doing right now. Edit it on the Now page." },
          { key: "githubStats", label: "Live GitHub stats", type: "toggle", hint: "Contribution calendar, top languages, stars and followers, loaded live from GitHub." },
          { key: "testimonials", label: "Testimonials", type: "toggle", hint: "Quotes from people you have worked with. Edit them on the Testimonials page." },
        ],
      },
    ],
  },
  {
    id: "seo",
    label: "SEO & sharing",
    group: "site",
    icon: "⌕",
    intro: "What Google and link previews (WhatsApp, LinkedIn, Facebook) show.",
    keys: ["meta"],
    blocks: [
      {
        kind: "fields",
        path: ["meta"],
        fields: [
          { key: "title", label: "Browser tab title", type: "text", wide: true },
          { key: "description", label: "Search description", type: "textarea", rows: 3, wide: true, hint: "Aim for 120–160 characters." },
          { key: "ogTitle", label: "Share card title", type: "text", wide: true, hint: "Empty = same as tab title." },
          { key: "ogDescription", label: "Share card description", type: "textarea", rows: 2, wide: true },
        ],
      },
    ],
  },
];

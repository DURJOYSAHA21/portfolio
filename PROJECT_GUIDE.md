# How this site works — a guide for editing it yourself

This is the personal portfolio at **https://durjoysaha21.github.io/**. It is a static site: no
server and no database. Everything you see is either written in one data file or fetched from the
GitHub API while you browse.

The rule that covers 90% of the edits you will ever want:

> **Every piece of text, every date, title, link, photo and CV path lives in
> `src/content/site.json`** — and you edit that file from the dashboard at
> **https://durjoysaha21.github.io/admin/**. The components only lay it out.

---

## 0. The admin dashboard (`/admin`)

**How it works.** `/admin` is a page of this same static site. You sign in with a GitHub token; the
page then reads `src/content/site.json` straight from the repository through the GitHub API, gives
you a form for every section, and on **publish** writes your edits (plus any uploaded photo / CV) to
`main` as **one commit**. The workflow in `.github/workflows/deploy.yml` sees that push, runs
`npm run build`, and publishes `out/` to the `gh-pages` branch. The live site updates in about
1–2 minutes, and the dashboard shows the deploy going from *deploying…* to *live*.

```
/admin (your browser) ──GitHub API──▶ commit on main ──Actions──▶ npm run build ──▶ gh-pages ──▶ live site
```

**One-time setup**

1. Push `.github/workflows/deploy.yml` to `main`. Pushing a workflow file needs the `workflow`
   scope: run `gh auth refresh -s workflow` once (or create the file in GitHub's web editor).
2. Create a **fine-grained personal access token** at GitHub → Settings → Developer settings →
   Fine-grained tokens:
   - Repository access: *Only select repositories* → `DURJOYSAHA21.github.io`
   - Permissions: **Contents: Read and write**, **Actions: Read and write**
   - Expiry: your choice (a year is fine; make a new one when it expires)
3. Open `/admin`, paste the token, tick *Remember on this device* if it is your own computer.

**What you can do there**

- Edit every section: profile & hero (name, status pill, tagline, photo, CV), stats strip, about,
  education, skills, projects, competitions, research, honors & activities, contact, the section
  titles / menu labels, and the SEO / link-preview text.
- Add, delete, duplicate and reorder (drag ⋮⋮ or ↑ ↓) any list item; tags are chips (Enter or comma
  to add, drag to reorder).
- Upload a new portrait or CV. Uploading the same file type replaces the file in place, so the CV
  link people already have keeps working.
- See which pages have unsaved edits (gold dot), discard them, or publish with `Ctrl+S`.
- **Drafts are kept locally** — close the tab by accident and the dashboard offers to restore them.
- **Version history** on the dashboard: load any earlier version into the editor and publish it to
  roll back. Every publish is an ordinary git commit, so `git revert` works too.
- **Raw JSON** page: bulk edits and a one-click backup download.
- **Redeploy now** button: rebuilds the site without changing anything.

**Safety.** The token is stored only in your browser (`localStorage`, or `sessionStorage` if you
untick *Remember*). Without a token the page can do nothing — anyone can open `/admin`, nobody else
can publish. Log out on shared computers. If a token leaks, delete it on GitHub; that instantly
disables it. If the file changed on GitHub since you opened the dashboard (another device or a hand
edit), publishing stops and asks which version should win instead of silently overwriting.

**Trying changes on your own computer first — `npm run local`.** Starts the dev server
(http://localhost:3000) plus a small helper (`scripts/admin-local.mjs`, port 4100). Open
http://localhost:3000/admin/ and click **use local mode**: no token needed, and *publish* writes
straight into `src/content/site.json` (and `public/` for uploads) while the page hot-reloads. Nothing
goes to GitHub. Review with `git diff`, undo with `git checkout -- src/content/site.json`, and when
you like it, commit and push as usual (§9). The helper only listens on localhost and refuses to
write anywhere except the content file and `public/`.

**Adding a new field** (something the dashboard cannot edit yet): add it to the type in
`src/lib/content.ts`, give it a value in `site.json`, render it in the component, and add a form
field for it in `src/components/admin/schema.ts`.

---

## 1. The stack (exact versions)

| Piece | Version | Where it is declared |
| --- | --- | --- |
| Next.js (App Router, Turbopack) | `16.4.5` | `package.json` → `dependencies.next` |
| React / React DOM | `19.3.0` | `package.json` → `dependencies` |
| TypeScript | `^5` (strict mode) | `tsconfig.json` |
| Tailwind CSS | `^4`, through `@tailwindcss/turbopack` | `package.json` → `devDependencies` |
| ESLint | `^9` + `eslint-config-next` | `eslint.config.mjs` |

Deliberately **not** used, so do not go looking for them:

- No UI component library (no shadcn, no MUI). Every card is plain HTML + Tailwind classes.
- No animation library. All motion is hand-written: CSS keyframes in `globals.css`, a canvas
  particle network (`Background.tsx`) and `IntersectionObserver` reveals (`motion.ts`). Everything
  stops for visitors with “reduce motion” turned on.
- No backend, no database, no API routes. The only “auth” is the GitHub token `/admin` uses (§0).
- Card pictures are either your uploaded images or artwork generated in code (`Cover.tsx`) — never fake screenshots (§7).

Fonts come from Google Fonts at build time via `next/font/google` (`layout.tsx`): **Sora** for
headings (`.display`), **Inter** for text, **JetBrains Mono** for dates, the typed roles and the admin.

---

## 2. Commands you will actually run

```bash
npm run dev        # start the dev server, http://localhost:3000 — hot reloads as you save
npm run local      # dev server + /admin in local mode (edits your files, publishes nothing)
npm run build      # produce the static site in out/ (this is what gets published)
npx eslint src --max-warnings=0   # lint; fails on warnings too, on purpose
npx tsc --noEmit   # type-check only, writes nothing
```

**Before you push anything, run all four.** `npm run build` is the one that matters: it type-checks,
lints and regenerates `out/` in a single pass.

There is **no** `npm run deploy` script. Any push to `main` deploys itself (§9).

---

## 3. Every folder and every file

### Root

| File | What it is for |
| --- | --- |
| `next.config.ts` | Turns the app into a static export. `output: "export"`, `trailingSlash: true`, `images.unoptimized: true` (no server means no image optimiser), and `basePath` / `assetPrefix` read from `NEXT_PUBLIC_BASE_PATH`. |
| `package.json` | Dependencies and the four scripts above. Note there is no `deploy` script. |
| `tsconfig.json` | TypeScript strict mode + the `@/*` → `src/*` path alias. That alias is why imports read `@/lib/site`. |
| `eslint.config.mjs` | Next's core-web-vitals + TypeScript rule sets. Ignores `.next/`, `out/`, `build/`. |
| `.gitignore` | Ignores `node_modules`, `.next/`, `/out/`, `*.tsbuildinfo`, `.env*`, `/vibe_images`. |
| `README.md` | Short project summary. This file is the long version. |
| `AGENTS.md` | Auto-written by `next dev` to warn AI tools that this Next version differs from older ones. Committing it keeps the tree clean; it is not your documentation. |
| `.github/workflows/deploy.yml` | Builds the site on every push to `main` (and on *Redeploy now*) and publishes `out/` to `gh-pages`. Pushing changes to this file needs the `workflow` OAuth scope (§10). |
| `vibe_images/` | 11 orphaned PNG sources from the deleted AI covers. Gitignored and unused — safe to delete. |
| `out/` | The generated static site. **Never edit, never commit** (gitignored). Rebuilt by `npm run build`. |
| `.next/` | Next's internal build cache. Never edit. |

### `src/app/` — the pages

Next's App Router: the folder *is* the route. Two pages: `/` (the portfolio) and `/admin`.

| File | What it is for |
| --- | --- |
| `layout.tsx` | The single root layout. Loads the three fonts, sets `<html lang>` and `<body>`, and builds `metadata` (tab title, description, Open Graph card) from `site.json` → `meta`. |
| `admin/page.tsx` | The `/admin` route. Marked `noindex`; renders `components/admin/AdminApp`. |
| `page.tsx` | The whole home page, in order. Lists the background overlays, then `<Nav/>`, then the eleven boards inside `<main>`, then the footer. **Reorder the site by reordering these lines.** |
| `globals.css` | ~790 lines. Every colour token, the card surface, and all animation. This is the theme (§7). |
| `favicon.ico` | Tab icon. |

### `src/content/` and `src/lib/` — the files that hold the truth

| File | What it is for |
| --- | --- |
| `content/site.json` | **All content.** Every section's text and data. The dashboard edits this file; you can also edit it by hand. |
| `lib/content.ts` | The TypeScript type of `site.json` (`SiteContent`), shared by the site and the dashboard. |
| `lib/site.ts` | Imports `site.json`, types it, and exports the same names the components always used (`PROFILE`, `BUILDS`, `RESEARCH`, `SECTIONS`…) plus derived values (`PAPER_TOTALS`, `TECH_WORDS`). |
| `github.ts` (57 lines) | The only runtime data: one call to `GET /users/DURJOYSAHA21/repos`. Cached in `sessionStorage` for 30 minutes, one automatic retry. Returns `null` on failure and the UI degrades to blanks. |

### `src/components/` — the public page, plus `admin/`

**Sections** — rendered by `page.tsx` in this order (the same order as `SECTION_IDS` in
`lib/content.ts`, which also numbers the sections and orders the top menu):

| File | What it shows | Data |
| --- | --- | --- |
| `Hero.tsx` | Status badge, giant gradient name, typed roles, tagline, buttons, photo in a spinning ring with two floating stat badges | `profile`, first two `stats` |
| `StatsStrip.tsx` | Glass stat cards that count up | `stats` (+ paper counts) |
| `Marquee.tsx` | Two endless rows of every skill | `skills` |
| `About.tsx` | Story card + quick-fact cards with icons | `about` |
| `Now.tsx` | “What I’m doing now” cards with a live badge (optional) | `now` |
| `Projects.tsx` | Filter tabs (All / Course / Personal) and picture cards with live GitHub stars; folds after `display.projectsShown` | `builds` |
| `GitHubStats.tsx` | Live GitHub totals, contribution calendar, top languages (optional) | GitHub API |
| `Research.tsx` | Count-up totals, summary, paper cards with status badges (fold after `display.papersShown`), research-code cards | `research`, `researchBuilds` |
| `Competitions.tsx` | Picture cards per hackathon / datathon / contest | `arenas` |
| `Education.tsx` | Timeline whose glowing line fills as you scroll | `education` |
| `Skills.tsx` | One card per skill group, icon picked from the group name | `skills` |
| `Awards.tsx` | Honor / certification cards (fold after `display.honorsShown`), activities | `honors`, `coCurricular` |
| `Testimonials.tsx` | Quote cards; hides itself when the list is empty (optional) | `testimonials` |
| `Contact.tsx` | Card with a spinning gradient border, email + copy, detail cards | `contact`, `contactCopy` |

**Building blocks**

| File | What it does |
| --- | --- |
| `Background.tsx` | The living backdrop: drifting colour glows, faint grid, particle network that reaches for the cursor, cursor glow. |
| `Section.tsx` | Centered header for every section: numbered eyebrow, big title (`*words*` become gradient), subtitle. |
| `Nav.tsx` | Floating glass pill: monogram, menu (sections with a menu label), “Hire me”, phone menu. |
| `Cover.tsx` | Card picture: the uploaded `image`, or generated artwork (colours, pattern, initials, icon, floating tech tags) seeded from the title. |
| `SpotlightCard.tsx` | Glass card whose border and sheen light up under the pointer. |
| `CountUp.tsx`, `Typewriter.tsx` | Number count-up on scroll; the typed roles under your name. |
| `ShowMore.tsx` | First N items + “Show all”. Hidden items stay in the HTML for search engines. |
| `Highlight.tsx` | Turns `*starred words*` into animated gradient text. |
| `Icons.tsx` | The small built-in icon set. |
| `Reveal.tsx` + `motion.ts` | Fade-and-rise as things scroll into view; the reduced-motion hook. |
| `Modal.tsx` | The shared pop-up window (project details, certificates, search). Escape closes the top one. |
| `ProjectModal.tsx` | Project pop-up: screenshot slideshow, full description, stack, demo / code / certificate. |
| `CommandPalette.tsx` | Ctrl+K / `/` search over sections, projects, papers, awards, plus quick actions. |
| `HonorFlip.tsx` | Honor card that flips over to show the certificate. |
| `Intro.tsx` | Opening name animation, once per visit (armed by the head script in `layout.tsx`). |
| `ScrollProgress.tsx`, `Cursor.tsx`, `PaletteSwitcher.tsx` | Top progress bar; trailing cursor ring; visitors’ colour switcher. |

**`admin/`** — the dashboard (only loaded on `/admin`):

| File | What it does |
| --- | --- |
| `AdminApp.tsx` | The whole dashboard: sign-in, sidebar, pages, publish dialog, deploy status, drafts, history, raw JSON. |
| `schema.ts` | Which fields each dashboard page shows. **Add a field here to make it editable.** |
| `blocks.tsx` | Renders a group of fields, or a reorderable list of items. |
| `fields.tsx` | The inputs: text, textarea, number, select, tag chips, paragraph lists, file upload, screenshot gallery, on/off switches, palette picker. |
| `github.ts` | Every GitHub API call: verify token, load `site.json`, commit (one commit per publish, with a conflict check), deploy runs, history. |

---

## 4. How one section renders

```
site.json ─▶ site.ts ─▶ Projects.tsx ─▶ <Section> (title column) + ShowMore ─▶ ProjectCard (.card)
                              ▲
github.ts ─(repos, live)──────┘  (only for stars / last update)
```

**Nothing gets a number typed in.** Order on the page is the order in the list, so dragging an item
up in `/admin` moves it up on the site, and totals (papers, “Show all 7 projects”) are counted.

---

## 5. Recipes — the edits you are most likely to want

**Use `/admin` for all of these** — each recipe names the dashboard page. The code snippets below
show the same data as it sits in `src/content/site.json` (now JSON, so keys and strings are quoted),
for when you prefer to edit by hand. An empty string `""` means “none” (no repo, no link).

### Add a project

Dashboard → **Projects**. By hand: `builds` in `site.json`. `repo` is `""` when the code is not on
GitHub (like `Luffy`), and the card simply renders with no link.

```json
{
  "title": "Name Of The Thing",
  "repo": "exact-github-repo-name",
  "track": "course",
  "period": "Jan — Apr 2027",
  "stack": ["React", "Python"],
  "blurb": "Two or three sentences on what it does and why you built it."
},
```

`repo` is `""` when there is no public repo; `track` is `"course"` or `"personal"` (decides the board
and the colour); `period` can be `""`; `stack` becomes the chips. JSON allows no comments and no
trailing comma after the last item — the dashboard handles that for you.

`track: "course"` → gold accent, appears under "course projects". `track: "personal"` → teal, under
"built for myself". The count card at the top of the board and the nav need no updating — they are
derived.

### Add a paper

Dashboard → **Research**. By hand: append to `research`:

```json
{
  "title": "Full paper title exactly as submitted",
  "venue": "ICCIT 2027",
  "status": "under review",
  "year": "2027",
  "link": "",
  "note": "What it does, in plain words."
},
```

`status` can also be e.g. `"Accepted · not yet published"` or `"Conference paper presented"`;
`link` stays `""` until a URL exists, then a “read paper ↗” chip appears.

The totals card (submitted / accepted / under review) **updates itself** — a paper counts as under
review when its status contains “under review” (any capitalisation) or is empty; everything else
counts as accepted.

### Change a CGPA, a college, or an exam result

Dashboard → **Education** (`education`). Newest first; the first entry gets the accent dot. `resultLabel` is the word before the result ("CGPA"
vs "GPA"). `points` is the bullet list.

### Add or remove a skill

Dashboard → **Skills** (`skills`) — one row per group, each skill a tag.

### Add an award or certificate

Dashboard → **Honors & activities** (`honors`, kind `honor` or `certification`; `coCurricular` for club roles).

Optional `link` renders a `verify ↗` chip. **Open the link in a browser first and read what it
says.** KnowledgeGate verification pages can render "Certificate Revoked — this certificate is no
longer valid" while still returning HTTP 200, so a curl check is not enough. The Complete CSS
certificate is in that state and is listed anyway at his instruction; the HTML and JavaScript ones
both read "Certificate Verified".

### Add a hackathon / datathon entry

Dashboard → **Competitions** (`arenas`). `kind` must be `"hackathon" | "datathon" | "contest"` — it is shown next to the event name.
`stack: []` renders no tags. `demo` (a URL, or `""`) adds a **Live demo** link to the card; `repo` is a
repository under your account (a fork works too).

Projects (`builds`) work the same way: `demo` shows **Live demo** on the card and in the pop-up, `image`
is the cover and `gallery` holds the extra screenshots. The screenshots taken from each project's
repository live in `public/uploads/projects/<project>/` as WebP (≤1600px wide), for example
`public/uploads/projects/zoo/01-admin-dashboard.webp`.

### Change the phone, email or address

Dashboard → **Contact** (`contact`). Two places show the address, and both read it from here: the contact section and the footer
(`page.tsx`). **Think before changing this** — you chose to publish the phone number and home
address on a public site.

### Change the name, role line, or which files the hero uses

Dashboard → **Profile & hero** (`profile`). Upload a new photo or CV right there; `photo` and `cv` are paths relative to `public/` (or full URLs). **Typed roles** are the words typed one after another under your name.

### Change the colours

Dashboard → **Theme & colours**. Click a palette card — **Ocean** (blue, cyan, emerald — the
default), **Aurora** (purple, cyan, pink), **Sunset** (orange, rose, gold), **Emerald** (green,
teal, lime) or **Custom**. The dashboard itself switches to that palette straight away as a
preview; **Preview on site ↗** opens the site in that palette without saving (it is just
`/?palette=sunset` on the URL, so you can also send that link to someone). Publish to make it live.

**Custom** uses the four colour pickers below the cards (main accent, second accent, warm
highlight, third accent). Button shades and background glows are mixed from them automatically.

Background glows, buttons, gradient text, card artwork, icons and the particle network all follow
the palette. The presets live in the `[data-palette="…"]` blocks at the top of `globals.css`; to add
another preset, copy a block and add it to `PALETTES` in `lib/content.ts`.

### Add a certificate to anything

Every entry — project, competition, paper, research code, education, honor, activity — has two
fields in the dashboard:

- **Certificate link**: an online certificate or verification page. The card gets a
  **Certificate** button that opens it in a new tab.
- **Certificate file**: upload a photo, scan or PDF. The **Certificate** button then opens a viewer
  on the site (zoomable image or embedded PDF) with *Download*, *Open full size* and, if a link is
  also set, *Verify online*.

Use either or both. Uploaded files go to `public/uploads/` in the same commit as your edit. For an
honor, a certificate *photo* also becomes the small picture on its card unless you set a separate
badge image.

### Turn the creative extras on or off

Dashboard → **Extra features**. Every extra has its own switch; turning one off removes it from
the site on the next publish, and nothing is deleted, so you can switch it back on later:

| Switch | What it does |
| --- | --- |
| Intro animation | Name assembles on an opening screen, once per visit; click or a key skips it. |
| 3D tilt cards | Cards tilt toward the mouse (desktop). |
| Cursor ring | A ring trails the mouse and grows over links and buttons (desktop). |
| Scroll progress bar | Glowing line along the top that fills as you scroll. |
| Project pop-up | Clicking a project opens screenshots, the full description and links. Add screenshots in Projects → *More screenshots*, and a *Live demo link* if there is one. |
| Search (Ctrl + K) | Search box for everything on the page, plus actions (copy email, CV, switch colours). |
| Visitor colour switcher | Colour button bottom-left; a visitor’s pick is remembered in their browser only. |
| Flip cards for honors | Honor cards flip to show the certificate photo. |
| “Now” section | Edit it on the **Now** page; update the date when you change it. |
| Live GitHub stats | Contribution calendar, languages, stars, followers. The calendar comes from the free github-contributions-api.jogruber.de service, because GitHub only gives it out with a token. |
| Testimonials | Edit on the **Testimonials** page. Only real quotes, with permission; the section disappears when the list is empty. |

Everything respects “reduce motion” in the visitor’s system settings.

### Add a picture to a card

Every project, competition, paper, research-code and honor entry has a **Cover image** field in the
dashboard. Upload a real screenshot, poster or certificate photo and it replaces the generated
artwork on that card. Landscape images around 1600×1000 look best on project cards.

### Change the headline / browser-tab title

Dashboard → **SEO & sharing** (`meta` in `site.json`).

### Change what is in the top menu, or a section's heading

Dashboard → **Section titles & menu**. A section is listed in the menu when it has a menu label;
leave the label empty to keep the menu short. Section order is `SECTION_IDS` in `lib/content.ts`
plus the order in `src/app/page.tsx` — keep the two the same.

### Show more / fewer items before “Show all”

Dashboard → **Projects**, **Research** or **Honors** → Layout (`display` in `site.json`). `0` shows
everything.

### Add a whole new section

Five places, in order:

1. Data in `site.json` plus its type in `lib/content.ts`; add the id to `SectionId` and
   `SECTION_IDS`, and a `sections` entry (heading, subtitle, menu label).
2. New `src/components/MyThing.tsx` wrapping its content in `<Section id="my-thing">` — copy
   `Competitions.tsx` as the smallest starting point.
3. Import it and place `<MyThing />` in `src/app/page.tsx` at the same position as in `SECTION_IDS`.
4. Add a page for it in `src/components/admin/schema.ts` so the dashboard can edit it.

---

## 6. Content that is still blank on purpose

These are `—` or `""` because the real value was never supplied. Fill them with truth, never a
guess — this page goes to recruiters.

| Where | What is missing |
| --- | --- |
| `ARENAS` → Financial Risk Prediction | Dataset, model, result. `stack: []` still empty. |
| `HONORS` → Dean's Award | Year. |
| `HONORS` → IT Essentials (Cisco) | Year. |
| `HONORS` → KnowledgeGate Complete CSS | Listed at his instruction, but `knowledgegate.ai/certificate/60E75900` renders "Certificate Revoked — this certificate is no longer valid". The `verify ↗` chip therefore leads a visitor to a page that contradicts the tile. Re-check that page and consider dropping the link if it still reads revoked. |
| `BUILDS` → Luffy | `period: ""` (no date given). Also no repo, and the `Graphics` repository does not clearly contain it. |
| `CONTACT` | No LinkedIn, no X handle. |
| `RESEARCH` → 4 under-review papers | No published link yet (`link` omitted). |

---

## 7. The theme, if you want to change how it looks

The design is **dark, creative and animated**: near-black background with violet / cyan / pink glows,
glass cards, gradient text, Sora headings. Everything visual is in `src/app/globals.css`:

| Section | What lives there |
| --- | --- |
| **tokens** | `:root` — `--bg`, `--fg`, `--fg-soft`, `--muted`, `--line`, the accent colours `--violet`, `--cyan`, `--pink`, `--amber`, `--green`, and `--grad` (the gradient used for text). |
| `@theme inline` | Maps the tokens to Tailwind names (`text-cyan`, `bg-bg`, `text-muted`…). |
| components | `.glass` + `.spot` (cards and the pointer glow), `.lift`, `.btn` / `.btn-glow`, `.chip`, `.eyebrow`, `.grad-text`, `.highlight`, `.reveal`, `.marquee`, `.caret`, `.float-a/b`, `.spin-slow`. |
| backdrop | `.aurora` (the drifting glows), `.grid-overlay`, `.cover` (generated card art), `.enter` (hero entrance). |
| reduced motion | One media query that stops every animation and transition. |
| admin | `.admin-theme` — the dashboard keeps its own navy palette. |

Things to know:
1. Animated gradients must be **horizontal (90deg) with the same first and last colour** — a slanted
   or non-looping gradient shows a hard seam as it moves.
2. Custom classes live in `@layer components` so Tailwind utilities can still override them.
3. Card art is generated, not fake: colours, pattern, initials and the icon come from the title.
   Upload real images for real screenshots; never add AI-made “app screenshots”.

---

## 8. Accessibility and performance notes

- “Reduce motion” stops all animation: the CSS media query, plus `useReducedMotion` for the canvas,
  count-ups and typewriter.
- The particle canvas pauses when the tab is hidden and caps at 80 particles.
- Typed roles and the marquee have screen-reader text; decorative layers are `aria-hidden`.
- A “Skip to content” link appears on keyboard focus.
- Phones: one column, a menu button, and `overflow-x-clip` on the hero so the spinning ring never
  causes sideways scrolling.

---

## 9. Deploying — the part that surprises people

GitHub Pages serves the `gh-pages` branch, and **`.github/workflows/deploy.yml` fills it for you**:
every push to `main` — a publish from `/admin` or your own `git push` — builds the site and replaces
`gh-pages` with the fresh `out/`. Watch it under the repository's **Actions** tab or on the
`/admin` dashboard. A newer push cancels a build still running for an older one.

```bash
git add src/content/site.json     # or whatever you changed
git commit -m "Add the new project"
git push origin main              # that's it — live in ~1–2 minutes
```

**Manual fallback** (only if Actions is down or the workflow is removed):

```bash

# 1. rebuild the static export
npm run build

# 2. publish out/ onto gh-pages
git worktree add .gh-pages-tmp gh-pages
cd .gh-pages-tmp
git rm -rq .                                  # this branch holds only the export
cp -r ../out/. .
git add -A
git commit -m "Deploy the updated export"
git push origin gh-pages
cd .. && git worktree remove .gh-pages-tmp

# 3. confirm GitHub actually built it (takes about a minute)
gh api repos/DURJOYSAHA21/DURJOYSAHA21.github.io/pages/builds/latest \
  --jq '"\(.status) \(.commit[0:7])"'
```

Then hard-refresh the site (`Ctrl+Shift+R`). Pages caches, so a normal reload can show the old one.

`.gh-pages-tmp` is already listed in `.git/info/exclude`, so it will never show up as an untracked
file. Never edit that branch by hand and never merge it into `main` — it is generated output, and
`gh-pages` is an orphan commit with no relation to your source history.

The workflow works out the address from the repository name, so the code can live in any repo:
a repo named `DURJOYSAHA21.github.io` is served from `/`; any other repo (say `portfolio`) is
served from `durjoysaha21.github.io/portfolio/`, and the build gets `NEXT_PUBLIC_BASE_PATH=/portfolio`.
It also sets `NEXT_PUBLIC_REPO`, so /admin saves to the repo it was built from. Both are compiled
into the export, not read at runtime. In a new repo, after the first run, set **Settings → Pages →
Source: Deploy from a branch → `gh-pages` / root** once.

---

## 10. Gotchas

- **`workflow` scope.** Pushing any change under `.github/workflows/` needs the `workflow` OAuth
  scope; the `gh` token here has only `repo, read:org, gist`, so the push fails with a 403. Run
  `gh auth refresh -s workflow` first.
- **Edit in one place at a time.** If you edit `site.json` by hand and push while `/admin` is open
  with unsaved edits, the dashboard will notice on publish and ask which version wins. Reloading the
  dashboard after a hand edit avoids the question.
- **Token expired?** `/admin` says “GitHub rejected the token”. Make a new one (§0) and sign in again.
- **GitHub API limit.** Unauthenticated calls are 60/hour per IP. Star counts and "pushed 3mo ago"
  can legitimately be blank. Do not add more API calls per page load.
- **Never type a count twice.** Totals are computed from the arrays that render them
  (`PAPER_TOTALS`, the `TALLY` in `Projects.tsx`, the “papers” stat set to *count automatically*). A hardcoded second number is how the site ends up
  claiming 6 papers while listing 7.
- **Style changes not showing in `npm run dev` / `npm run local`?** The dev server sometimes keeps
  an old copy of `globals.css`. Stop it, delete the `.next` folder, start it again. Content edits
  (site.json, the dashboard) always reload fine; the production build is never affected.
- **`out/` file locks on Windows.** `npm run build` occasionally dies with
  `EBUSY: resource busy or locked` if something is reading `out/` — a running preview server or an
  open browser tab. Close it and re-run; it is not a code error.
- **CRLF warnings.** Git prints `LF will be replaced by CRLF` on every commit here. Harmless —
  Windows line endings. Do not "fix" it by re-writing every file.
- **Do not put secrets in this repo.** It is public. The `JOB-PORTAL` repository's README contains
  demo credentials; nothing from it should be copied onto this site.
- **Line numbers in this guide drift.** When you look for something, search for the class name, the
  export name, or the section comment rather than trusting the number.

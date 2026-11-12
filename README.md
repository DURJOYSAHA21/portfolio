# Portfolio

Personal portfolio for Durjoy Saha — final-year CSE student, ML and backend. Next.js 16 with the App
Router, Tailwind v4, TypeScript strict, statically exported to `out/` so GitHub Pages serves it as
plain files.

**To edit the site, open [/admin](https://durjoysaha21.github.io/admin/)** — a dashboard that edits
every section, uploads a new photo or CV, and publishes in one click (setup in
[PROJECT_GUIDE.md §0](PROJECT_GUIDE.md#0-the-admin-dashboard-admin)).

**To change the code, read [PROJECT_GUIDE.md](PROJECT_GUIDE.md) first.** It maps every file, gives
copy-paste recipes for common changes (add a project, add a paper, change a colour), and explains the
two-branch deploy.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes the static site to out/
```

## What lives where

- Every fact on the page — profile, education, skills, builds, competitions, papers, honors, contact
  links, section titles, SEO text — is data in `src/content/site.json`, typed by `src/lib/content.ts`
  and exposed through `src/lib/site.ts`. Sections read from it and hold no copy of their own.
- `/admin` (`src/components/admin/`) edits that file through the GitHub API with the owner's token:
  one commit per publish, conflict-checked, with drafts, version history and deploy status.
- The board each section renders is a `bento` grid of `Tile`s. One card material, and `lead` lights
  the single headline card per board.
- Theme tokens, the card surface and every animation are in `src/app/globals.css`.
- Cards carry no imagery. Build, arena and paper tiles all share one typographic shape — label,
  accent line, bold title, note, chips. No screenshots are shipped, because none of the repositories
  have any.
- `src/lib/github.ts` is the only runtime data source.

## Live data

Project and competition cards show a repository's stars and last push, fetched in the browser from
`GET /users/DURJOYSAHA21/repos`. There is no backend and no key, so the unauthenticated 60/hour per
IP cap applies to each visitor: the single call is cached in `sessionStorage` for 30 minutes and
retried once on failure. If it still fails, the cards keep their static content and the live field
stays blank.

## Deploying

The deploy workflow picks the address from the repository name: `<user>.github.io` is served from
`/`, any other repo from `/<repo>/` (it sets `NEXT_PUBLIC_BASE_PATH` and `NEXT_PUBLIC_REPO` for the
build, so the admin also saves to the right repo).

GitHub Pages publishes the `gh-pages` branch, which holds nothing but the built `out/` of this
repository. `.github/workflows/deploy.yml` regenerates it on every push to `main` — including every
publish from `/admin` — so the branch is never edited by hand. Pushing changes under
`.github/workflows/` requires an OAuth token with the `workflow` scope.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customPaletteCss, paperTotals, type SiteContent } from "@/lib/content";
import { BlockView, setIn, type Edit } from "./blocks";
import { buttonClass, inputClass, primaryClass, type UploadApi } from "./fields";
import {
  CONTENT_PATH,
  ConflictError,
  REPO,
  LOCAL_TOKEN,
  SITE_URL,
  canUseLocal,
  commitChanges,
  contentHistory,
  deployRuns,
  fileToBase64,
  isLocal,
  loadContent,
  redeploy,
  serialize,
  utf8ToBase64,
  verifyToken,
  type CommitSummary,
  type Run,
  type Viewer,
} from "./github";
import { PAGES, type Page } from "./schema";

const TOKEN_KEY = "portfolio-admin:token";
const DRAFT_KEY = "portfolio-admin:draft";

const TOKEN_URL =
  "https://github.com/settings/personal-access-tokens/new?name=Portfolio%20admin&description=Edit%20my%20portfolio%20from%20%2Fadmin&expires_in=365&contents=write&actions=write";

/** Storage can throw (private mode, blocked site data); the admin must still work. */
const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  isLocal(key: string) {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
  set(key: string, value: string, persist: boolean) {
    try {
      (persist ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  del(key: string) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

type Staged = { repoPath: string; sitePath: string; base64: string; name: string; size: number };
type Draft = { sha: string; at: number; content: SiteContent };
type Toast = { text: string; tone: "ok" | "warn" | "error" };

const ANCHORS: Record<string, string> = {
  profile: "top",
  stats: "top",
  about: "about",
  education: "education",
  skills: "skills",
  projects: "projects",
  competitions: "competitions",
  research: "research",
  honors: "honors",
  contact: "contact",
};

/**
 * Same as `asset` in lib/site, copied so the dashboard never imports site.json:
 * in local mode every save rewrites that file, and importing it would hot-reload
 * the dashboard mid-edit.
 */
const asset = (path: string) =>
  /^(https?:|blob:|data:)/.test(path) ? path : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

const timeAgo = (iso: string | number) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "file";

const extOf = (name: string) => {
  const ext = (name.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
};

/* =================================================================== app */

export default function AdminApp() {
  const [phase, setPhase] = useState<"boot" | "login" | "loading" | "ready">("boot");
  const [token, setToken] = useState("");
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loginError, setLoginError] = useState("");

  const [base, setBase] = useState<{ content: SiteContent; sha: string } | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [staged, setStaged] = useState<Record<string, Staged>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [restore, setRestore] = useState<Draft | null>(null);

  const [pageId, setPageId] = useState("dashboard");
  const [saveOpen, setSaveOpen] = useState(false);
  const [runs, setRuns] = useState<Run[] | null | undefined>(undefined);
  const [awaiting, setAwaiting] = useState<{ sha: string; at: number } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const flash = useCallback((text: string, tone: Toast["tone"] = "ok") => setToast({ text, tone }), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.tone === "error" ? 8000 : 4500);
    return () => clearTimeout(id);
  }, [toast]);

  /* ------------------------------------------------------------ session */

  const refreshRuns = useCallback(async (t: string) => setRuns(await deployRuns(t)), []);

  const connect = useCallback(
    async (t: string, remember: boolean) => {
      setPhase("loading");
      setLoginError("");
      try {
        const user = await verifyToken(t);
        const loaded = await loadContent(t);
        store.set(TOKEN_KEY, t, remember);
        setToken(t);
        setViewer(user);
        setBase(loaded);
        setDraft(loaded.content);

        const saved = store.get(DRAFT_KEY);
        if (saved) {
          try {
            const d = JSON.parse(saved) as Draft;
            if (serialize(d.content) !== serialize(loaded.content)) setRestore(d);
            else store.del(DRAFT_KEY);
          } catch {
            store.del(DRAFT_KEY);
          }
        }
        setPhase("ready");
        refreshRuns(t);
      } catch (e) {
        store.del(TOKEN_KEY);
        setLoginError(message(e));
        setPhase("login");
      }
    },
    [refreshRuns]
  );

  useEffect(() => {
    // One-time boot from the URL and storage, which only exist in the browser.
    const fromHash = window.location.hash.slice(1);
    const saved = store.get(TOKEN_KEY);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (fromHash) setPageId(fromHash);
    if (saved) connect(saved, store.isLocal(TOKEN_KEY));
    else setPhase("login");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [connect]);

  useEffect(() => {
    const onHash = () => setPageId(window.location.hash.slice(1) || "dashboard");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id: string) => {
    setPageId(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };

  const logout = () => {
    if (dirty && !window.confirm("You have unsaved changes. They stay as a local draft. Log out?")) return;
    store.del(TOKEN_KEY);
    setToken("");
    setViewer(null);
    setBase(null);
    setDraft(null);
    setRuns(undefined);
    setPhase("login");
  };

  /* -------------------------------------------------------------- state */

  const baseText = useMemo(() => (base ? serialize(base.content) : ""), [base]);
  const draftText = useMemo(() => (draft ? serialize(draft) : ""), [draft]);
  const usedUploads = useMemo(
    () => Object.values(staged).filter((s) => draftText.includes(JSON.stringify(s.sitePath))),
    [staged, draftText]
  );
  const dirty = baseText !== draftText || usedUploads.length > 0;

  const changedKeys = useMemo(() => {
    if (!base || !draft) return new Set<string>();
    const keys = new Set<string>();
    for (const key of Object.keys(draft) as (keyof SiteContent)[]) {
      if (JSON.stringify(draft[key]) !== JSON.stringify(base.content[key])) keys.add(key);
    }
    // a staged upload marks the section whose content points at it
    for (const up of usedUploads) {
      for (const key of Object.keys(draft) as (keyof SiteContent)[]) {
        if (JSON.stringify(draft[key]).includes(JSON.stringify(up.sitePath))) keys.add(key);
      }
    }
    return keys;
  }, [base, draft, usedUploads]);

  const changedPages = PAGES.filter((p) => p.keys.some((k) => changedKeys.has(k)));

  // Local draft, so a closed tab or a crash never loses typing.
  const restorePending = restore !== null;
  useEffect(() => {
    if (!base || !draft || restorePending) return;
    const id = setTimeout(() => {
      if (baseText !== draftText) {
        store.set(DRAFT_KEY, JSON.stringify({ sha: base.sha, at: Date.now(), content: draft }), true);
      } else store.del(DRAFT_KEY);
    }, 500);
    return () => clearTimeout(id);
  }, [base, draft, baseText, draftText, restorePending]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) setSaveOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty]);

  const edit: Edit = useCallback((path, value) => setDraft((d) => (d ? setIn(d, path, value) : d)), []);

  const uploads: UploadApi = {
    stage: async (file, current) => {
      const ext = extOf(file.name) || file.type.split("/")[1] || "bin";
      const local = current.startsWith("/") && !current.startsWith("//");
      // Same type as the current file: replace it in place so shared links keep working.
      const sitePath =
        local && extOf(current) === ext
          ? current.split("?")[0]
          : `/uploads/${slug(file.name.replace(/\.[^.]+$/, ""))}-${Date.now().toString(36)}.${ext}`;
      const base64 = await fileToBase64(file);
      const url = URL.createObjectURL(file);
      setStaged((s) => ({
        ...s,
        [sitePath]: { repoPath: `public${sitePath}`, sitePath, base64, name: file.name, size: file.size },
      }));
      setPreviews((p) => ({ ...p, [sitePath]: url }));
      return sitePath;
    },
    preview: (p) => previews[p] ?? asset(p),
    isStaged: (p) => p in staged,
  };

  const discard = () => {
    if (!base || !window.confirm("Throw away every unsaved change?")) return;
    setDraft(base.content);
    setStaged({});
    store.del(DRAFT_KEY);
    flash("Changes discarded.", "warn");
  };

  /* --------------------------------------------------------------- save */

  const save = async (commitMessage: string, force: boolean) => {
    if (!base || !draft) return;
    const snapshot = draft;
    const text = serialize(snapshot);
    const files = Object.values(staged).filter((s) => text.includes(JSON.stringify(s.sitePath)));
    const result = await commitChanges(token, {
      changes: [
        { path: CONTENT_PATH, base64: utf8ToBase64(text) },
        ...files.map((f) => ({ path: f.repoPath, base64: f.base64 })),
      ],
      message: commitMessage,
      expectedSha: base.sha,
      force,
    });
    setBase({ content: snapshot, sha: result.contentSha });
    setStaged({});
    store.del(DRAFT_KEY);
    setSaveOpen(false);
    if (isLocal(token)) {
      flash("Saved to your files — the local site has reloaded.");
      return;
    }
    setAwaiting({ sha: result.commitSha, at: Date.now() });
    flash("Saved to GitHub — the site is rebuilding.");
    refreshRuns(token);
  };

  const reloadLatest = async () => {
    const latest = await loadContent(token);
    setBase(latest);
    setDraft(latest.content);
    setStaged({});
    store.del(DRAFT_KEY);
    setSaveOpen(false);
    flash("Loaded the latest version from GitHub.", "warn");
  };

  /* ------------------------------------------------------------- deploy */

  const awaitedRun = awaiting ? runs?.find((r) => r.head_sha === awaiting.sha) : undefined;
  const deployState: "idle" | "queued" | "building" | "live" | "failed" | "unknown" = (() => {
    if (runs === null) return awaiting ? "unknown" : "idle";
    if (awaiting && !awaitedRun) return "queued";
    const run = awaitedRun ?? runs?.[0];
    if (!run) return "idle";
    if (run.status !== "completed") return "building";
    return run.conclusion === "success" ? "live" : "failed";
  })();

  useEffect(() => {
    if (phase !== "ready" || !token || runs === null) return;
    const building = runs?.some((r) => r.status !== "completed");
    const waiting = awaiting && !awaitedRun && Date.now() - awaiting.at < 3 * 60_000;
    if (!building && !waiting) return;
    const id = setTimeout(() => refreshRuns(token), 5000);
    return () => clearTimeout(id);
  }, [phase, token, runs, awaiting, awaitedRun, refreshRuns]);

  useEffect(() => {
    if (!awaitedRun || awaitedRun.status !== "completed") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a finished deploy
    setAwaiting(null);
    if (awaitedRun.conclusion === "success") flash("Your changes are live ✓");
    else flash("The deploy failed — open it on GitHub to see why.", "error");
  }, [awaitedRun, flash]);

  /* ------------------------------------------------------------- render */

  if (phase === "boot" || phase === "loading") {
    return (
      <Shell>
        <Centered>
          <p className="animate-pulse text-sm font-medium text-gold">
            {phase === "loading" ? "Connecting to GitHub…" : "Loading…"}
          </p>
        </Centered>
      </Shell>
    );
  }

  if (phase === "login" || !draft || !base || !viewer) {
    return (
      <Shell>
        <Login error={loginError} onSubmit={connect} />
      </Shell>
    );
  }

  const page = PAGES.find((p) => p.id === pageId);
  const localMode = isLocal(token);
  const siteUrl = localMode ? "" : SITE_URL;

  return (
    <Shell palette={draft.theme?.palette} custom={customPaletteCss(draft.theme?.custom)}>
    <div className="min-h-screen text-fg">
      {/* ---------------------------------------------------------- top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-[rgba(6,7,13,0.75)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <a href="#dashboard" onClick={() => go("dashboard")} className="flex items-center gap-2.5">
            <span className="display grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--b1),var(--a1))] text-[0.78rem] text-white shadow-[0_0_24px_-6px_var(--a1)]">
              {(draft.profile.first[0] ?? "") + (draft.profile.last[0] ?? "")}
            </span>
            <span className="leading-tight">
              <span className="display block text-[0.95rem] text-white">Admin</span>
              <span className="block text-[0.7rem] text-muted">Portfolio manager</span>
            </span>
          </a>
          <DeployPill state={deployState} run={awaitedRun ?? runs?.[0]} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="hidden sm:block">
              <a href={siteUrl || "/"} target="_blank" rel="noreferrer noopener" className={buttonClass}>
                View site ↗
              </a>
            </span>
            {dirty && (
              <button type="button" onClick={discard} className={buttonClass}>
                Discard
              </button>
            )}
            <button type="button" disabled={!dirty} onClick={() => setSaveOpen(true)} className={primaryClass}>
              {dirty ? `Publish${changedPages.length ? ` (${changedPages.length})` : ""}` : "All saved"}
            </button>
            <UserMenu viewer={viewer} onLogout={logout} />
          </div>
        </div>
        {/* mobile page picker */}
        <div className="border-t border-line px-4 py-2 lg:hidden">
          <select
            value={pageId}
            onChange={(e) => go(e.target.value)}
            className={`${inputClass} text-[0.85rem]`}
            aria-label="Section"
          >
            <option value="dashboard">Dashboard</option>
            {PAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.keys.some((k) => changedKeys.has(k)) ? " •" : ""}
              </option>
            ))}
            <option value="raw">Raw JSON</option>
          </select>
        </div>
      </header>

      <div className="flex">
        {/* --------------------------------------------------------- sidebar */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto border-r border-line bg-white/[0.03] px-3 py-5 lg:block">
          <NavItem id="dashboard" label="Dashboard" icon="⌂" active={pageId} go={go} />
          <NavGroup title="Content" pages={PAGES.filter((p) => p.group === "content")} active={pageId} go={go} changed={changedKeys} />
          <NavGroup title="Site" pages={PAGES.filter((p) => p.group === "site")} active={pageId} go={go} changed={changedKeys} />
          <p className="mb-1 mt-6 px-3 text-[0.72rem] font-semibold text-muted/70">Advanced</p>
          <NavItem id="raw" label="Raw JSON" icon="{}" active={pageId} go={go} />
        </aside>

        {/* ------------------------------------------------------------ main */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-4xl space-y-5">
            {localMode && (
              <p className="rounded-2xl border border-[color-mix(in_srgb,var(--teal)_45%,transparent)] bg-[color-mix(in_srgb,var(--teal)_8%,rgba(3,11,20,0.6))] px-4 py-3 text-[0.84rem] leading-snug">
                <strong className="text-teal">Local mode.</strong> Publishing writes to the files on this
                computer and <a href="/" target="_blank" className="text-teal underline">localhost:3000</a> reloads
                — nothing goes to GitHub or the live site.
              </p>
            )}
            {restore && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--gold)_55%,transparent)] bg-[color-mix(in_srgb,var(--gold)_10%,rgba(3,11,20,0.6))] p-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-[0.86rem] leading-snug">
                  <strong className="text-gold">Unsaved draft found</strong> from {timeAgo(restore.at)}.
                  {restore.sha !== base.sha && (
                    <span className="text-clay">
                      {" "}
                      The site changed since then — restoring will replace those newer edits when you publish.
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={primaryClass}
                    onClick={() => {
                      setDraft(restore.content);
                      setRestore(null);
                    }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => {
                      store.del(DRAFT_KEY);
                      setRestore(null);
                    }}
                  >
                    Discard draft
                  </button>
                </div>
              </div>
            )}

            {pageId === "raw" ? (
              <RawEditor draft={draft} base={base.content} onApply={(c) => setDraft(c)} flash={flash} />
            ) : page ? (
              <PageView page={page} draft={draft} edit={edit} uploads={uploads} changed={changedKeys} siteUrl={siteUrl} />
            ) : (
              <Dashboard
                draft={draft}
                viewer={viewer}
                runs={runs}
                token={token}
                go={go}
                flash={flash}
                onRedeploy={async () => {
                  await redeploy(token);
                  flash("Redeploy started.");
                  setTimeout(() => refreshRuns(token), 2500);
                }}
                onLoadVersion={async (sha, date) => {
                  const old = await loadContent(token, sha);
                  setDraft(old.content);
                  flash(`Loaded the version from ${timeAgo(date)}. Review it, then publish to restore it.`, "warn");
                }}
              />
            )}
          </div>
        </main>
      </div>

      {saveOpen && (
        <SaveDialog
          changedPages={changedPages}
          uploads={usedUploads}
          onClose={() => setSaveOpen(false)}
          onSave={save}
          onReloadLatest={reloadLatest}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`mono fixed bottom-5 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border px-4 py-3 text-[0.74rem] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)] ${
            toast.tone === "error"
              ? "border-clay/70 bg-[#3a2420] text-clay"
              : toast.tone === "warn"
                ? "border-gold/60 bg-[#2b3040] text-gold"
                : "border-teal/60 bg-[#173640] text-teal"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
    </Shell>
  );
}

/* ================================================================ pieces */

/**
 * Root of every admin screen. Carries its own data-palette, so the dashboard's
 * accent previews the palette being edited before it is published.
 */
function Shell({
  palette = "ocean",
  custom = "",
  children,
}: {
  palette?: string;
  custom?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-theme" data-palette={palette}>
      {custom && <style dangerouslySetInnerHTML={{ __html: custom }} />}
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-4 py-10">{children}</div>;
}

function NavItem({
  id,
  label,
  icon,
  active,
  go,
  dot,
}: {
  id: string;
  label: string;
  icon: string;
  active: string;
  go: (id: string) => void;
  dot?: boolean;
}) {
  const on = active === id;
  return (
    <button
      type="button"
      onClick={() => go(id)}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[0.86rem] transition-colors ${
        on
          ? "bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] text-gold shadow-[inset_2px_0_0_var(--gold)]"
          : "text-fg/80 hover:bg-white/5 hover:text-fg"
      }`}
    >
      <span aria-hidden="true" className="mono w-5 text-center text-[0.8rem] opacity-80">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {dot && <span title="Unsaved changes" className="h-1.5 w-1.5 rounded-full bg-gold" />}
    </button>
  );
}

function NavGroup({
  title,
  pages,
  active,
  go,
  changed,
}: {
  title: string;
  pages: Page[];
  active: string;
  go: (id: string) => void;
  changed: Set<string>;
}) {
  return (
    <>
      <p className="mb-1 mt-6 px-3 text-[0.72rem] font-semibold text-muted/70">{title}</p>
      {pages.map((p) => (
        <NavItem
          key={p.id}
          id={p.id}
          label={p.label}
          icon={p.icon}
          active={active}
          go={go}
          dot={p.keys.some((k) => changed.has(k))}
        />
      ))}
    </>
  );
}

function DeployPill({ state, run }: { state: string; run?: Run }) {
  const look: Record<string, { text: string; cls: string; pulse?: boolean }> = {
    idle: { text: "", cls: "" },
    queued: { text: "Queued", cls: "text-gold border-gold/50", pulse: true },
    building: { text: "Deploying…", cls: "text-gold border-gold/50", pulse: true },
    live: { text: "Live", cls: "text-teal border-teal/50" },
    failed: { text: "Deploy failed", cls: "text-clay border-clay/60" },
    unknown: { text: "Saved · live in ~2 min", cls: "text-muted border-line" },
  };
  const l = look[state];
  if (!l?.text) return null;
  const body = (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.74rem] ${l.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${l.pulse ? "animate-pulse" : ""}`} />
      {l.text}
    </span>
  );
  return run ? (
    <a href={run.html_url} target="_blank" rel="noreferrer noopener" title="Open the deploy on GitHub">
      {body}
    </a>
  ) : (
    body
  );
}

function UserMenu({ viewer, onLogout }: { viewer: Viewer; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="block h-9 w-9 overflow-hidden rounded-full border border-line hover:border-gold"
        aria-label="Account"
      >
        {viewer.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- GitHub avatar
          <img src={viewer.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="mono grid h-full w-full place-items-center bg-teal/15 text-[0.7rem] font-bold text-teal">
            {(viewer.name ?? viewer.login).slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-56 rounded-lg border border-line bg-[#0f1220] p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]">
          <p className="px-2 py-1.5 text-[0.82rem]">
            {viewer.name ?? viewer.login}
            <span className="mono block text-[0.66rem] text-muted">@{viewer.login}</span>
          </p>
          <a
            href={`https://github.com/${REPO.owner}/${REPO.name}`}
            target="_blank"
            rel="noreferrer noopener"
            className="block rounded-lg px-2 py-1.5 text-[0.82rem] text-fg/80 hover:bg-white/5"
          >
            Repository ↗
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="block w-full rounded-lg px-2 py-1.5 text-left text-[0.82rem] text-clay hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- login */

function Login({ error, onSubmit }: { error: string; onSubmit: (token: string, remember: boolean) => void }) {
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [help, setHelp] = useState(false);

  return (
    <Centered>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (token.trim()) onSubmit(token.trim(), remember);
        }}
        className="w-full max-w-md rounded-2xl border border-[color-mix(in_srgb,var(--gold)_35%,transparent)] bg-white/[0.03] p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)] sm:p-8"
      >
        <p className="flex items-center gap-2.5">
          <span className="display grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--b1),var(--a1))] text-[0.78rem] text-white">
            ✦
          </span>
          <span className="display text-[0.95rem] text-white">Portfolio admin</span>
        </p>
        <h1 className="display mt-4 text-[1.6rem] font-semibold leading-tight">Sign in to edit your site</h1>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">
          Changes are saved to <span className="mono text-fg/80">{REPO.name}</span> on GitHub and go live
          about two minutes later.
        </p>

        <label htmlFor="token" className="mb-1.5 mt-6 block text-[0.82rem] font-medium text-fg/80">
          GitHub access token
        </label>
        <input
          id="token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="github_pat_…"
          className={`${inputClass} mono`}
        />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.82rem] text-fg/80">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          Remember on this device
        </label>

        {error && (
          <p className="mt-4 rounded-lg border border-clay/50 bg-clay/10 px-3 py-2 text-[0.82rem] text-clay">
            {error}
          </p>
        )}

        <button type="submit" disabled={!token.trim()} className={`${primaryClass} mt-6 w-full`}>
          Open dashboard →
        </button>

        {canUseLocal() && (
          <button
            type="button"
            onClick={() => onSubmit(LOCAL_TOKEN, false)}
            className="mt-3 w-full rounded-full border border-[color-mix(in_srgb,var(--teal)_55%,transparent)] px-5 py-2.5 text-[0.68rem] font-bold text-teal transition-colors hover:bg-teal/10"
          >
            Use local mode (edit files on this computer)
          </button>
        )}

        <button
          type="button"
          onClick={() => setHelp((h) => !h)}
          className="mono mt-5 text-[0.66rem] text-gold hover:underline"
        >
          {help ? "− Hide" : "+ How do I get a token?"}
        </button>
        {help && (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[0.84rem] leading-relaxed text-fg/80">
            <li>
              Open{" "}
              <a href={TOKEN_URL} target="_blank" rel="noreferrer noopener" className="text-gold underline">
                GitHub → new fine-grained token
              </a>{" "}
              (signed in as {REPO.owner}).
            </li>
            <li>
              <b>Repository access:</b> “Only select repositories” → <span className="mono">{REPO.name}</span>.
            </li>
            <li>
              <b>Permissions:</b> Contents → <i>Read and write</i>; Actions → <i>Read and write</i> (for deploy
              status and the redeploy button).
            </li>
            <li>Generate, copy it, and paste it above. It is stored only in this browser.</li>
          </ol>
        )}
      </form>
    </Centered>
  );
}

/* ------------------------------------------------------------------ page */

function PageView({
  page,
  draft,
  edit,
  uploads,
  changed,
  siteUrl,
}: {
  page: Page;
  draft: SiteContent;
  edit: Edit;
  uploads: UploadApi;
  changed: Set<string>;
  siteUrl: string;
}) {
  const anchor = ANCHORS[page.id];
  const isChanged = page.keys.some((k) => changed.has(k));
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 pb-1">
        <div>
          <h1 className="display text-[1.7rem] font-semibold leading-tight">
            {page.label}
            {isChanged && (
              <span className="mono ml-3 align-middle text-[0.74rem] text-gold">
                ● Unsaved
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-2xl text-[0.88rem] leading-snug text-muted">{page.intro}</p>
        </div>
        {anchor && (
          <a href={`${siteUrl}/#${anchor}`} target="_blank" rel="noreferrer noopener" className={buttonClass}>
            See it live ↗
          </a>
        )}
      </div>
      {page.blocks.map((block, i) => (
        <BlockView key={`${page.id}-${i}`} block={block} data={draft} edit={edit} uploads={uploads} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------- dashboard */

function Dashboard({
  draft,
  viewer,
  runs,
  token,
  go,
  flash,
  onRedeploy,
  onLoadVersion,
}: {
  draft: SiteContent;
  viewer: Viewer;
  runs: Run[] | null | undefined;
  token: string;
  go: (id: string) => void;
  flash: (t: string, tone?: Toast["tone"]) => void;
  onRedeploy: () => Promise<void>;
  onLoadVersion: (sha: string, date: string) => Promise<void>;
}) {
  const [history, setHistory] = useState<CommitSummary[] | null | undefined>(undefined);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let alive = true;
    contentHistory(token)
      .then((h) => alive && setHistory(h))
      .catch(() => alive && setHistory(null));
    return () => {
      alive = false;
    };
  }, [token]);

  const papers = paperTotals(draft.research);
  const tiles = [
    { id: "projects", label: "projects", value: draft.builds.length },
    { id: "competitions", label: "competitions", value: draft.arenas.length },
    { id: "research", label: "papers", value: papers.submitted, note: `${papers.underReview} under review` },
    { id: "honors", label: "honors & certs", value: draft.honors.length },
    { id: "skills", label: "skills", value: new Set(draft.skills.flatMap((g) => g.items)).size },
    { id: "education", label: "education", value: draft.education.length },
  ];

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      flash(message(e), "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div>
        <h1 className="display text-[1.9rem] font-semibold leading-tight">
          Hi, {viewer.name?.split(" ")[0] ?? draft.profile.first} 👋
        </h1>
        <p className="mt-1 text-[0.9rem] text-muted">
          Pick a section on the left, edit, then hit <b className="text-gold">publish</b>. Your work is
          kept as a local draft until you do.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => go(t.id)}
            className="rounded-2xl border border-line bg-white/[0.03] p-4 text-left transition-colors hover:border-gold/60"
          >
            <span className="display block text-[1.9rem] leading-none tabular-nums text-gold">{t.value}</span>
            <span className="mt-1.5 block text-[0.85rem] font-medium text-fg/85">{t.label}</span>
            {t.note && <span className="mt-1 block text-[0.74rem] text-muted">{t.note}</span>}
          </button>
        ))}
      </div>

      {/* deploys */}
      <section className="rounded-2xl border border-line bg-white/[0.03]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <h2 className="display text-[1.02rem] text-white">Deploys</h2>
          {runs && (
            <button
              type="button"
              className={buttonClass}
              disabled={busy === "redeploy"}
              onClick={() => run("redeploy", onRedeploy)}
            >
              {busy === "redeploy" ? "Starting…" : "↻ Redeploy now"}
            </button>
          )}
        </header>
        <div className="p-5">
          {runs === undefined && <p className="text-[0.85rem] text-muted">Loading…</p>}
          {runs === null &&
            (isLocal(token) ? (
              <p className="text-[0.85rem] text-muted">
                Local mode: nothing is deployed. Publishing saves into your files and the local site at
                localhost:3000 reloads by itself.
              </p>
            ) : (
              <SetupHelp />
            ))}
          {runs && runs.length === 0 && (
            <p className="text-[0.85rem] text-muted">No deploys yet. Your next publish starts the first one.</p>
          )}
          {runs && runs.length > 0 && (
            <ul className="divide-y divide-line">
              {runs.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      r.status !== "completed"
                        ? "animate-pulse bg-gold"
                        : r.conclusion === "success"
                          ? "bg-teal"
                          : r.conclusion === "cancelled" || r.conclusion === "skipped"
                            ? "bg-muted/50"
                            : "bg-clay"
                    }`}
                  />
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="min-w-0 flex-1 truncate text-[0.86rem] hover:text-gold"
                  >
                    {r.display_title}
                  </a>
                  <span className="mono shrink-0 text-[0.66rem] text-muted">
                    {r.status === "completed" ? r.conclusion : r.status.replace("_", " ")} · {timeAgo(r.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* history */}
      <section className="rounded-2xl border border-line bg-white/[0.03]">
        <header className="border-b border-line px-5 py-4">
          <h2 className="display text-[1.02rem] text-white">Version history</h2>
          <p className="mt-1 text-[0.8rem] text-muted">
            Every save is a commit. Load an older version into the editor, then publish to roll back.
          </p>
        </header>
        <div className="p-5">
          {history === undefined && <p className="text-[0.85rem] text-muted">Loading…</p>}
          {history === null && <p className="text-[0.85rem] text-muted">Could not load the history.</p>}
          {history && history.length === 0 && (
            <p className="text-[0.85rem] text-muted">
              {isLocal(token)
                ? "History appears here once you publish through GitHub. Locally, git diff shows your changes."
                : "No saved versions yet."}
            </p>
          )}
          {history && history.length > 0 && (
            <ul className="divide-y divide-line">
              {history.map((c, i) => (
                <li key={c.sha} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block truncate text-[0.86rem] hover:text-gold"
                    >
                      {c.commit.message.split("\n")[0]}
                    </a>
                    <span className="mono text-[0.64rem] text-muted">
                      {c.sha.slice(0, 7)} · {c.commit.author.name} · {timeAgo(c.commit.author.date)}
                    </span>
                  </div>
                  {i === 0 ? (
                    <span className="mono text-[0.74rem] text-teal">Current</span>
                  ) : (
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={busy === c.sha}
                      onClick={() => run(c.sha, () => onLoadVersion(c.sha, c.commit.author.date))}
                    >
                      {busy === c.sha ? "Loading…" : "Load"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function SetupHelp() {
  return (
    <div className="space-y-2 text-[0.85rem] leading-relaxed text-fg/80">
      <p>
        <b className="text-clay">Deploy status unavailable.</b> Either the auto-deploy workflow is not on GitHub
        yet, or your token lacks the <i>Actions: Read</i> permission. Saving still works — check the
        repository’s Actions tab to see builds.
      </p>
      <p className="text-muted">
        To enable auto-deploy, the file <span className="mono">.github/workflows/deploy.yml</span> must be pushed
        to <span className="mono">main</span> (see PROJECT_GUIDE.md → “Admin dashboard”).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- raw json */

function RawEditor({
  draft,
  base,
  onApply,
  flash,
}: {
  draft: SiteContent;
  base: SiteContent;
  onApply: (c: SiteContent) => void;
  flash: (t: string, tone?: Toast["tone"]) => void;
}) {
  const current = serialize(draft);
  const [text, setText] = useState(current);
  const [error, setError] = useState("");
  const [lastSeen, setLastSeen] = useState(current);
  if (current !== lastSeen) {
    // the draft changed elsewhere (restore, discard): follow it
    setLastSeen(current);
    setText(current);
  }

  const apply = () => {
    try {
      const parsed = JSON.parse(text) as SiteContent;
      const missing = Object.keys(base).filter((k) => !(k in parsed));
      if (missing.length) throw new Error(`Missing top-level keys: ${missing.join(", ")}`);
      for (const k of Object.keys(base) as (keyof SiteContent)[]) {
        if (Array.isArray(base[k]) !== Array.isArray(parsed[k])) {
          throw new Error(`“${k}” must be ${Array.isArray(base[k]) ? "a list" : "an object"}.`);
        }
      }
      setError("");
      onApply(parsed);
      flash("JSON applied to the draft.");
    } catch (e) {
      setError(message(e));
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([current], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div>
        <h1 className="display text-[1.7rem] font-semibold leading-tight">Raw JSON</h1>
        <p className="mt-1 text-[0.88rem] text-muted">
          The whole site as one file (<span className="mono">{CONTENT_PATH}</span>). Use it for bulk edits or
          backups. Apply puts it into the draft; nothing is published until you hit publish.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className={`${inputClass} mono h-[60vh] resize-y text-[0.76rem] leading-relaxed`}
      />
      {error && <p className="rounded-lg border border-clay/50 bg-clay/10 px-3 py-2 text-[0.82rem] text-clay">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryClass} disabled={text === current} onClick={apply}>
          Apply to draft
        </button>
        <button type="button" className={buttonClass} disabled={text === current} onClick={() => setText(current)}>
          Reset
        </button>
        <button type="button" className={buttonClass} onClick={download}>
          ↓ Download backup
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ save modal */

function SaveDialog({
  changedPages,
  uploads,
  onClose,
  onSave,
  onReloadLatest,
}: {
  changedPages: Page[];
  uploads: Staged[];
  onClose: () => void;
  onSave: (message: string, force: boolean) => Promise<void>;
  onReloadLatest: () => Promise<void>;
}) {
  const auto = `Update ${
    changedPages.length ? changedPages.map((p) => p.label.toLowerCase()).join(", ") : "content"
  } from the admin`;
  const [text, setText] = useState(auto);
  const [state, setState] = useState<"idle" | "saving" | "conflict" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (force = false) => {
    setState("saving");
    try {
      await onSave(text.trim() || auto, force);
    } catch (e) {
      if (e instanceof ConflictError) setState("conflict");
      else {
        setError(message(e));
        setState("error");
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && state !== "saving" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, state]);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-white/[0.04] px-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && state !== "saving" && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="save-title" className="w-full max-w-lg rounded-2xl border border-[color-mix(in_srgb,var(--gold)_45%,transparent)] bg-[#0f1220] p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]">
        <h2 id="save-title" className="display text-[1.35rem] font-semibold">
          Publish changes
        </h2>

        {state === "conflict" ? (
          <>
            <p className="mt-3 text-[0.88rem] leading-relaxed text-fg/85">
              The site content was changed on GitHub after you opened this dashboard (another tab, device, or a
              hand edit). What should win?
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="button" className={primaryClass} onClick={() => submit(true)}>
                Publish mine anyway
              </button>
              <button
                type="button"
                className={buttonClass}
                onClick={async () => {
                  setState("saving");
                  try {
                    await onReloadLatest();
                  } catch (e) {
                    setError(message(e));
                    setState("error");
                  }
                }}
              >
                Load theirs (drop mine)
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {changedPages.map((p) => (
                <li key={p.id} className="chip mono text-[0.7rem] text-gold">
                  {p.label}
                </li>
              ))}
              {uploads.map((u) => (
                <li key={u.sitePath} className="chip mono text-[0.7rem] text-teal">
                  ↑ {u.name} · {(u.size / 1024 / 1024).toFixed(1)} MB
                </li>
              ))}
            </ul>
            <label htmlFor="commit-msg" className="mb-1.5 mt-5 block text-[0.82rem] font-medium text-fg/80">
              Change note (commit message)
            </label>
            <input
              id="commit-msg"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && state !== "saving" && submit()}
              className={inputClass}
            />
            {state === "error" && (
              <p className="mt-3 rounded-lg border border-clay/50 bg-clay/10 px-3 py-2 text-[0.82rem] text-clay">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={buttonClass} disabled={state === "saving"} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={primaryClass} disabled={state === "saving"} onClick={() => submit()}>
                {state === "saving" ? "Publishing…" : "Publish →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

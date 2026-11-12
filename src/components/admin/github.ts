/**
 * The admin's whole "backend": GitHub's REST API, called straight from the browser
 * with the owner's personal access token. Saving creates one commit on `main`;
 * the deploy workflow then rebuilds the static site from it.
 */
import type { SiteContent } from "@/lib/content";

// The deploy workflow sets NEXT_PUBLIC_REPO to the repository it runs in, so the
// admin saves to whichever repo the site was built from.
const [OWNER = "DURJOYSAHA21", NAME = "DURJOYSAHA21.github.io"] = (process.env.NEXT_PUBLIC_REPO ?? "")
  .split("/")
  .filter(Boolean);

export const REPO = {
  owner: OWNER,
  name: NAME,
  branch: "main",
  workflow: "deploy.yml",
} as const;

export const CONTENT_PATH = "src/content/site.json";
export const SITE_URL = `https://${REPO.owner.toLowerCase()}.github.io${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

const API = "https://api.github.com";
const R = `/repos/${REPO.owner}/${REPO.name}`;

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Someone (or another tab) committed the content file after this session loaded it. */
export class ConflictError extends Error {}

/* ---------------------------------------------------------- local mode */

/**
 * `npm run local` starts scripts/admin-local.mjs on this port. In local mode the
 * dashboard reads and writes the files in your working copy instead of GitHub,
 * and `next dev` hot-reloads the site — nothing is published.
 */
export const LOCAL_TOKEN = "local";
export const LOCAL_API = "http://localhost:4100";
export const isLocal = (token: string) => token === LOCAL_TOKEN;
export const canUseLocal = () =>
  typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

async function local<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${LOCAL_API}${path}`, {
      ...init,
      cache: "no-store",
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new GitHubError("The local helper is not running. Start everything with: npm run local", 0);
  }
  const data = (await res.json()) as T & { error?: string; conflict?: boolean };
  if (res.status === 409 && data.conflict) throw new ConflictError(data.error ?? "Conflict");
  if (!res.ok) throw new GitHubError(data.error ?? res.statusText, res.status);
  return data;
}

async function gh<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    // API responses carry max-age=60; a stale read right after a save would undo it.
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      message = ((await res.json()) as { message?: string }).message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new GitHubError(explain(res.status, message), res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

function explain(status: number, message: string) {
  if (status === 401) return "GitHub rejected the token (expired or mistyped).";
  if (status === 403 && /rate limit/i.test(message)) return "GitHub rate limit hit — wait a minute.";
  if (status === 403 || status === 404)
    return `The token cannot do this on ${REPO.name} (${message}). Check its repository access and permissions.`;
  return message;
}

/* ------------------------------------------------------------- encoding */

export function utf8ToBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function base64ToUtf8(b64: string) {
  const binary = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Pretty-printed with a trailing newline, so hand edits and admin edits diff cleanly. */
export const serialize = (content: SiteContent) => `${JSON.stringify(content, null, 2)}\n`;

/* ---------------------------------------------------------------- calls */

export type Viewer = { login: string; avatar_url: string; name: string | null };

export async function verifyToken(token: string) {
  if (isLocal(token)) {
    await local("/health");
    return { login: "local", avatar_url: "", name: "Local preview" } satisfies Viewer;
  }
  const [user, repo] = await Promise.all([
    gh<Viewer>(token, "/user"),
    gh<{ permissions?: { push?: boolean } }>(token, R),
  ]);
  if (repo.permissions && repo.permissions.push === false) {
    throw new GitHubError(`@${user.login} does not have write access to ${REPO.name}.`, 403);
  }
  return user;
}

export async function loadContent(token: string, ref: string = REPO.branch) {
  if (isLocal(token)) return local<{ content: SiteContent; sha: string }>("/content");
  const file = await gh<{ content: string; sha: string }>(
    token,
    `${R}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(ref)}`
  );
  return { content: JSON.parse(base64ToUtf8(file.content)) as SiteContent, sha: file.sha };
}

export type FileChange = { path: string; base64: string };

/**
 * Writes every change as a single commit through the Git Data API, so a save
 * with a new photo and edited text triggers one deploy, not two.
 */
export async function commitChanges(
  token: string,
  {
    changes,
    message,
    expectedSha,
    force = false,
  }: { changes: FileChange[]; message: string; expectedSha: string; force?: boolean }
) {
  if (isLocal(token)) {
    return local<{ commitSha: string; commitUrl: string; contentSha: string }>("/save", {
      method: "POST",
      body: JSON.stringify({ changes, expectedSha, force }),
    });
  }

  const head = await gh<{ object: { sha: string } }>(token, `${R}/git/ref/heads/${REPO.branch}`);
  const parent = head.object.sha;

  if (!force) {
    const current = await gh<{ sha: string }>(
      token,
      `${R}/contents/${CONTENT_PATH}?ref=${parent}`
    );
    if (current.sha !== expectedSha) {
      throw new ConflictError(
        "The content file changed on GitHub since you opened the dashboard."
      );
    }
  }

  const commit = await gh<{ tree: { sha: string } }>(token, `${R}/git/commits/${parent}`);

  const blobs = await Promise.all(
    changes.map(async (change) => {
      const blob = await gh<{ sha: string }>(token, `${R}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: change.base64, encoding: "base64" }),
      });
      return { path: change.path, sha: blob.sha };
    })
  );

  const tree = await gh<{ sha: string }>(token, `${R}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: commit.tree.sha,
      tree: blobs.map((b) => ({ path: b.path, mode: "100644", type: "blob", sha: b.sha })),
    }),
  });

  const created = await gh<{ sha: string; html_url: string }>(token, `${R}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [parent] }),
  });

  await gh(token, `${R}/git/refs/heads/${REPO.branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: created.sha }),
  });

  return {
    commitSha: created.sha,
    commitUrl: `https://github.com/${REPO.owner}/${REPO.name}/commit/${created.sha}`,
    contentSha: blobs.find((b) => b.path === CONTENT_PATH)?.sha ?? expectedSha,
  };
}

export type Run = {
  id: number;
  status: "queued" | "in_progress" | "completed" | "waiting" | "requested" | "pending";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  head_sha: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  display_title: string;
  event: string;
};

/** null means the token cannot read Actions, or the workflow is not installed yet. */
export async function deployRuns(token: string): Promise<Run[] | null> {
  if (isLocal(token)) return null;
  try {
    const data = await gh<{ workflow_runs: Run[] }>(
      token,
      `${R}/actions/workflows/${REPO.workflow}/runs?per_page=6`
    );
    return data.workflow_runs;
  } catch {
    return null;
  }
}

export async function redeploy(token: string) {
  await gh(token, `${R}/actions/workflows/${REPO.workflow}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref: REPO.branch }),
  });
}

export type CommitSummary = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } };
};

export async function contentHistory(token: string): Promise<CommitSummary[]> {
  if (isLocal(token)) return [];
  return gh<CommitSummary[]>(
    token,
    `${R}/commits?path=${encodeURIComponent(CONTENT_PATH)}&sha=${REPO.branch}&per_page=8`
  );
}

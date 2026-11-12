import { GITHUB_USER } from "./site";

const API = "https://api.github.com";
const TTL_MS = 30 * 60 * 1000;

export type Repo = {
  name: string;
  stargazers_count: number;
  html_url: string;
  pushed_at: string;
  language: string | null;
  fork: boolean;
  forks_count: number;
};

export type GitHubUser = { public_repos: number; followers: number; following: number; created_at: string };

/** One day of the contribution calendar; level is 0–4 like GitHub's own colours. */
export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type Contributions = { total: number; days: Day[] };

/**
 * The site is fully static, so every visitor hits the API themselves and the
 * unauthenticated cap is 60 requests/hour per IP. Each call is cached in
 * session storage, so a few refreshes do not exhaust it.
 */
async function cachedJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  if (typeof window === "undefined") return null;
  const key = `gh:${url}`;

  try {
    const hit = sessionStorage.getItem(key);
    if (hit) {
      const parsed = JSON.parse(hit) as { at: number; data: T };
      if (Date.now() - parsed.at < TTL_MS) return parsed.data;
    }
  } catch {
    /* stale or blocked storage: fall through to a live fetch */
  }

  const request = () => fetch(url, { headers }).then((res) => (res.ok ? (res.json() as Promise<T>) : null));

  try {
    let data = await request();
    // one retry so a dropped request does not leave the widget blank until reload
    if (data === null) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      data = await request();
    }
    if (data === null) return null;

    try {
      sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
    } catch {
      /* quota: not worth failing the widget over */
    }
    return data;
  } catch {
    return null;
  }
}

const GH = { Accept: "application/vnd.github+json" };

export const getRepos = () => cachedJson<Repo[]>(`${API}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, GH);

export const getUser = () => cachedJson<GitHubUser>(`${API}/users/${GITHUB_USER}`, GH);

/**
 * GitHub's REST API has no contribution calendar without a token, so this uses
 * the free, open-source github-contributions-api (it reads the public profile).
 */
export async function getContributions(): Promise<Contributions | null> {
  const data = await cachedJson<{ total: Record<string, number>; contributions: Day[] }>(
    `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`
  );
  if (!data?.contributions?.length) return null;
  return { total: data.total?.lastYear ?? data.contributions.reduce((n, d) => n + d.count, 0), days: data.contributions };
}

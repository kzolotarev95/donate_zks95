export type GitHubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  updated_at: string;
};

export type GitHubProfile = {
  login: string;
  html_url: string;
  blog: string;
  location: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
};

const headers = {
  "User-Agent": "donate-zks95",
  Accept: "application/vnd.github+json",
};

export async function getGitHubProfile(username: string): Promise<GitHubProfile | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as GitHubProfile;
  } catch {
    return null;
  }
}

export async function getGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      {
        headers,
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const repos = (await response.json()) as GitHubRepo[];
    return repos
      .filter((repo) => !repo.name.endsWith(".github.io"))
      .sort((left, right) => right.stargazers_count - left.stargazers_count || compareDates(right.updated_at, left.updated_at));
  } catch {
    return [];
  }
}

export function pickFeaturedRepos(repos: GitHubRepo[], names: string[]) {
  const byName = new Map(repos.map((repo) => [repo.name, repo]));
  const selected = names.map((name) => byName.get(name)).filter(Boolean) as GitHubRepo[];
  const fallback = repos.filter((repo) => !names.includes(repo.name)).slice(0, Math.max(0, 6 - selected.length));
  return [...selected, ...fallback].slice(0, 6);
}

function compareDates(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

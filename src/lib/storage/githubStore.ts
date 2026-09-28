import { base64ToUtf8, utf8ToBase64 } from './base64'
import { AuthError, ConflictError, type DocStore, type StoredDoc } from './types'

const API = 'https://api.github.com'

export interface GitHubStoreOptions {
  token: string
  owner: string
  repo: string
  fetch?: typeof fetch
}

export interface GitHubIdentity {
  login: string
  /**
   * Token expiry reported by GitHub for fine-grained tokens, ISO string. Browsers may not be
   * allowed to read this header (CORS), so it can be missing even when the token expires.
   */
  tokenExpiresAt?: string
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  }
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}

export const MISSING_CONTENTS_PERMISSION =
  'The token can\'t read or write files in this repository. On GitHub, edit the token and set Repository permissions → Contents to "Read and write".'

async function failure(res: Response, what: string): Promise<never> {
  if (res.status === 401) throw new AuthError()
  let detail = ''
  try {
    detail = ((await res.json()) as { message?: string }).message ?? ''
  } catch {
    // body wasn't JSON
  }
  // Fine-grained tokens without the Contents permission get this 403.
  if (res.status === 403 && /not accessible by personal access token/i.test(detail)) {
    throw new Error(MISSING_CONTENTS_PERMISSION)
  }
  throw new Error(`${what} failed: ${res.status} ${detail}`.trim())
}

/** Checks the token and repo access. Returns who the token belongs to. */
export async function verifyGitHubAccess(
  opts: GitHubStoreOptions,
): Promise<GitHubIdentity & { canWrite: boolean; isPrivate: boolean }> {
  const f = opts.fetch ?? fetch
  const userRes = await f(`${API}/user`, { headers: headers(opts.token), cache: 'no-store' })
  if (!userRes.ok) await failure(userRes, 'Checking the token')
  const user = (await userRes.json()) as { login: string }
  const expiry = userRes.headers.get('github-authentication-token-expiration')

  const repoRes = await f(`${API}/repos/${opts.owner}/${opts.repo}`, {
    headers: headers(opts.token),
    cache: 'no-store',
  })
  if (repoRes.status === 404) {
    throw new Error(
      `Can't see ${opts.owner}/${opts.repo}. Check the name and that the token has access to it.`,
    )
  }
  if (!repoRes.ok) await failure(repoRes, 'Checking the repository')
  const repo = (await repoRes.json()) as {
    private: boolean
    permissions?: { push?: boolean }
  }

  // The repo's `permissions` reflect the account, not the token, so probe file access directly.
  // An empty repository answers 404, which is fine.
  const contentsRes = await f(`${API}/repos/${opts.owner}/${opts.repo}/contents/`, {
    headers: headers(opts.token),
    cache: 'no-store',
  })
  if (!contentsRes.ok && contentsRes.status !== 404) {
    await failure(contentsRes, 'Checking file access')
  }

  return {
    login: user.login,
    tokenExpiresAt: expiry ? new Date(expiry).toISOString() : undefined,
    canWrite: repo.permissions?.push ?? false,
    isPrivate: repo.private,
  }
}

export class GitHubStore implements DocStore {
  private readonly opts: GitHubStoreOptions
  private readonly f: typeof fetch

  constructor(opts: GitHubStoreOptions) {
    this.opts = opts
    this.f = opts.fetch ?? fetch.bind(globalThis)
  }

  private url(path: string) {
    return `${API}/repos/${this.opts.owner}/${this.opts.repo}/contents/${encodePath(path)}`
  }

  async read<T>(path: string): Promise<StoredDoc<T> | null> {
    // no-store: GitHub sends max-age=60, which would hide our own recent writes.
    const res = await this.f(this.url(path), {
      headers: headers(this.opts.token),
      cache: 'no-store',
    })
    if (res.status === 404) return null
    if (!res.ok) await failure(res, `Reading ${path}`)
    const body = (await res.json()) as { content?: string; sha: string; type: string }
    if (body.type !== 'file' || body.content == null) {
      throw new Error(`${path} is not a readable file`)
    }
    return { data: JSON.parse(base64ToUtf8(body.content)) as T, version: body.sha }
  }

  async write<T>(path: string, data: T, version: string | null, message: string) {
    const res = await this.f(this.url(path), {
      method: 'PUT',
      headers: { ...headers(this.opts.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(JSON.stringify(data, null, 2) + '\n'),
        ...(version ? { sha: version } : {}),
      }),
    })
    // 409: sha mismatch. 422: file exists but no sha was sent (created elsewhere).
    if (res.status === 409 || res.status === 422) throw new ConflictError(path)
    if (!res.ok) await failure(res, `Saving ${path}`)
    const body = (await res.json()) as { content: { sha: string } }
    return body.content.sha
  }

  async list(dir: string): Promise<string[]> {
    const res = await this.f(this.url(dir), {
      headers: headers(this.opts.token),
      cache: 'no-store',
    })
    if (res.status === 404) return []
    if (!res.ok) await failure(res, `Listing ${dir}`)
    const body = (await res.json()) as { name: string; type: string }[]
    return Array.isArray(body) ? body.filter((e) => e.type === 'file').map((e) => e.name) : []
  }
}

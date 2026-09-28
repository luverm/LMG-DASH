import { base64ToUtf8, utf8ToBase64 } from './base64'
import { GitHubStore, verifyGitHubAccess } from './githubStore'
import { ConflictError } from './types'

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers })
}

describe('GitHubStore', () => {
  it('reads and decodes a UTF-8 JSON file', async () => {
    const fetch = vi.fn(async () =>
      json({ type: 'file', sha: 'abc', content: utf8ToBase64('{"name":"Zoë ⬡"}') }),
    )
    const store = new GitHubStore({ token: 't', owner: 'me', repo: 'data', fetch })
    expect(await store.read('users/me/x.json')).toEqual({ data: { name: 'Zoë ⬡' }, version: 'abc' })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/me/data/contents/users/me/x.json',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('returns null for missing files and [] for missing directories', async () => {
    const fetch = vi.fn(async () => json({ message: 'Not Found' }, 404))
    const store = new GitHubStore({ token: 't', owner: 'me', repo: 'data', fetch })
    expect(await store.read('nope.json')).toBeNull()
    expect(await store.list('nope')).toEqual([])
  })

  it('sends the sha when updating and maps conflicts', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ content: { sha: 'new' } }))
      .mockResolvedValueOnce(json({ message: 'sha mismatch' }, 409))
    const store = new GitHubStore({ token: 't', owner: 'me', repo: 'data', fetch })

    expect(await store.write('a.json', { a: 1 }, 'old', 'msg')).toBe('new')
    const body = JSON.parse(fetch.mock.calls[0][1].body as string)
    expect(body.sha).toBe('old')
    expect(JSON.parse(base64ToUtf8(body.content))).toEqual({ a: 1 })

    await expect(store.write('a.json', { a: 2 }, 'old', 'msg')).rejects.toBeInstanceOf(
      ConflictError,
    )
  })
})

describe('verifyGitHubAccess', () => {
  it('returns the login, expiry and repo permissions', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        json({ login: 'luverm' }, 200, {
          'github-authentication-token-expiration': '2027-09-28 12:00:00 UTC',
        }),
      )
      .mockResolvedValueOnce(json({ private: true, permissions: { push: true } }))
    const result = await verifyGitHubAccess({ token: 't', owner: 'luverm', repo: 'd', fetch })
    expect(result).toMatchObject({ login: 'luverm', canWrite: true, isPrivate: true })
    expect(result.tokenExpiresAt).toMatch(/^2027-09-28/)
  })
})

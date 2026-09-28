import { open, seal, WrongPassphraseError } from './crypto'

describe('seal/open', () => {
  it('round-trips with the right passphrase', async () => {
    const box = await seal('github_pat_secret', 'correct horse', 1000)
    expect(box.data).not.toContain('secret')
    expect(await open(box, 'correct horse')).toBe('github_pat_secret')
  })

  it('rejects a wrong passphrase', async () => {
    const box = await seal('github_pat_secret', 'correct horse', 1000)
    await expect(open(box, 'wrong horse')).rejects.toBeInstanceOf(WrongPassphraseError)
  })
})

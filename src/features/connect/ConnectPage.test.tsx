import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { open } from '@/lib/crypto'
import { ConnectPage } from './ConnectPage'

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 })
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Data repository'), 'luverm/lmg-dash-data')
  await user.type(screen.getByLabelText('Token'), 'github_pat_abc')
  await user.type(screen.getByLabelText('Passphrase'), 'long enough')
  await user.type(screen.getByLabelText('Repeat passphrase'), 'long enough')
  await user.click(screen.getByRole('button', { name: 'Connect' }))
}

describe('ConnectPage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('checks access and stores the token sealed with the passphrase', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json({ login: 'luverm' }))
        .mockResolvedValueOnce(json({ private: true, permissions: { push: true } }))
        .mockResolvedValueOnce(
          new Response('{"message":"This repository is empty."}', { status: 404 }),
        ),
    )
    const onConnected = vi.fn()
    const user = userEvent.setup()
    render(<ConnectPage onConnected={onConnected} />)
    await fillForm(user)

    await vi.waitFor(() => expect(onConnected).toHaveBeenCalled(), { timeout: 5000 })
    const [connection, token] = onConnected.mock.calls[0]
    expect(connection).toMatchObject({
      mode: 'github',
      owner: 'luverm',
      repo: 'lmg-dash-data',
      login: 'luverm',
    })
    expect(JSON.stringify(connection)).not.toContain('github_pat_abc')
    expect(await open(connection.sealedToken, 'long enough')).toBe('github_pat_abc')
    expect(token).toBe('github_pat_abc')
  })

  it('refuses a public data repository', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(json({ login: 'luverm' }))
        .mockResolvedValueOnce(json({ private: false, permissions: { push: true } }))
        .mockResolvedValueOnce(new Response('{}', { status: 404 })),
    )
    const onConnected = vi.fn()
    const user = userEvent.setup()
    render(<ConnectPage onConnected={onConnected} />)
    await fillForm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/is public/)
    expect(onConnected).not.toHaveBeenCalled()
  })
})

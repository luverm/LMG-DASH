import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { useSolutions } from '../SolutionsContext'

export function NewSolutionDialog({ onClose }: { onClose(): void }) {
  const { create } = useSolutions()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')

  function save(e?: FormEvent) {
    e?.preventDefault()
    if (!title.trim()) return
    const s = create({ title, summary: summary.trim() || undefined })
    onClose()
    navigate(`/solutions/${s.id}`)
  }

  return (
    <Dialog
      title="New solution"
      shape="square"
      color="var(--lime)"
      onClose={onClose}
      footer={
        <ShapeButton
          shape="square"
          color="var(--lime)"
          variant="solid"
          disabled={!title.trim()}
          onClick={() => save()}
        >
          Create and open
        </ShapeButton>
      }
    >
      <form onSubmit={save} style={{ display: 'grid', gap: '0.9rem' }}>
        <label className="field">
          <span>Name</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Invoice export to Exact"
            autoFocus
          />
        </label>
        <label className="field">
          <span>In one or two sentences: what does it do?</span>
          <textarea
            className="input"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Picks up new invoices every night and books them in Exact."
          />
        </label>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useToast } from '@/components/feedback/ToastContext'
import { Dialog } from '@/components/ui/Dialog'
import { ShapeButton } from '@/components/ui/ShapeButton'
import { useProjects } from '../ProjectsContext'
import { PeopleInput } from './PeopleInput'

/** Note down a coworker's wish in a few seconds; details can come later. */
export function QuickCaptureDialog({ onClose }: { onClose(): void }) {
  const { create, people } = useProjects()
  const toast = useToast()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [from, setFrom] = useState<string[]>([])
  const [problem, setProblem] = useState('')

  function save(e?: FormEvent, open = false) {
    e?.preventDefault()
    if (!title.trim()) return
    const project = create({ title, requestedBy: from, problem })
    onClose()
    if (open) navigate(`/projects/${project.id}`)
    else toast(`Saved "${project.title}"`)
  }

  return (
    <Dialog
      title="New wish"
      shape="hexagon"
      color="var(--butter)"
      onClose={onClose}
      footer={
        <>
          <ShapeButton
            shape="hexagon"
            color="var(--butter)"
            variant="ghost"
            disabled={!title.trim()}
            onClick={() => save(undefined, true)}
          >
            Save and open
          </ShapeButton>
          <ShapeButton
            shape="hexagon"
            color="var(--butter)"
            variant="solid"
            disabled={!title.trim()}
            onClick={() => save()}
          >
            Save
          </ShapeButton>
        </>
      }
    >
      <form onSubmit={save} style={{ display: 'grid', gap: '0.9rem' }}>
        <label className="field">
          <span>What's the wish?</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Automatic invoice export to Exact"
            autoFocus
          />
        </label>
        <PeopleInput value={from} people={people} onChange={setFrom} label="From whom" />
        <label className="field">
          <span>Problem (optional)</span>
          <textarea
            className="input"
            rows={3}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What hurts today?"
          />
        </label>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}

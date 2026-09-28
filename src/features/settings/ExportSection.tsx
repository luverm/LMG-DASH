import { useRef, useState } from 'react'
import { useData } from '@/app/data/DataContext'
import { useToast } from '@/components/feedback/ToastContext'
import { ShapeButton } from '@/components/ui/ShapeButton'
import {
  createBackup,
  download,
  loadAllDays,
  parseBackup,
  restoreBackup,
  toCSV,
  toMarkdown,
} from '@/features/export/exporters'
import { useProjects } from '@/features/projects/ProjectsContext'
import { dateKey } from '@/lib/time'
import styles from './Settings.module.css'

type Range = '7' | '30' | 'all'

export function ExportSection() {
  const { engine, paths } = useData()
  const { projectName } = useProjects()
  const toast = useToast()
  const [range, setRange] = useState<Range>('7')
  const [busy, setBusy] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  async function run(task: () => Promise<void>) {
    setBusy(true)
    try {
      await task()
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function days() {
    const all = await loadAllDays(engine, paths)
    if (range === 'all') return all
    const from = new Date()
    from.setDate(from.getDate() - Number(range) + 1)
    return all.filter((d) => d.date >= dateKey(from))
  }

  const stamp = () => dateKey(new Date())

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <select
          className="input"
          style={{ width: 'auto' }}
          aria-label="Report period"
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="all">Everything</option>
        </select>
        <ShapeButton
          shape="square"
          disabled={busy}
          onClick={() =>
            run(async () =>
              download(
                `lmg-dash-${stamp()}.md`,
                toMarkdown(await days(), projectName),
                'text/markdown',
              ),
            )
          }
        >
          Markdown report
        </ShapeButton>
        <ShapeButton
          shape="square"
          disabled={busy}
          onClick={() =>
            run(async () =>
              download(`lmg-dash-${stamp()}.csv`, toCSV(await days(), projectName), 'text/csv'),
            )
          }
        >
          CSV
        </ShapeButton>
      </div>
      <p className={styles.muted}>
        A backup holds everything: days, projects and settings. Restoring merges it in, so nothing
        you tracked since is lost.
      </p>
      <div className={styles.row}>
        <ShapeButton
          shape="circle"
          disabled={busy}
          onClick={() =>
            run(async () =>
              download(
                `lmg-dash-backup-${stamp()}.json`,
                JSON.stringify(await createBackup(engine, paths), null, 2),
                'application/json',
              ),
            )
          }
        >
          Download backup
        </ShapeButton>
        <ShapeButton
          shape="triangle"
          variant="ghost"
          disabled={busy}
          onClick={() => file.current?.click()}
        >
          Restore from backup
        </ShapeButton>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            run(async () => {
              const backup = parseBackup(await f.text())
              if (
                !confirm(
                  `Restore ${backup.days.length} days and ${Object.keys(backup.projects.projects).length} projects from this backup?`,
                )
              )
                return
              await restoreBackup(engine, paths, backup)
              toast('Backup restored. Reloading…')
              setTimeout(() => location.reload(), 800)
            })
          }}
        />
      </div>
    </div>
  )
}

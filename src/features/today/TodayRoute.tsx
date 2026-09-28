import { useEffect } from 'react'
import { useProjects } from '@/features/projects/ProjectsContext'
import { useWorkday } from '@/features/workday/WorkdayContext'
import { TodayPage } from './TodayPage'

/** Today with project names, and remembering which days each project was worked on. */
export function TodayRoute() {
  const { projectName, markWorked } = useProjects()
  const { today } = useWorkday()

  const workedProjects = [
    ...new Set(
      today.segments.filter((s) => s.kind === 'work' && s.projectId).map((s) => s.projectId!),
    ),
  ].join(',')
  useEffect(() => {
    for (const id of workedProjects ? workedProjects.split(',') : []) markWorked(id, today.date)
  }, [workedProjects, today.date, markWorked])

  return <TodayPage projectName={projectName} />
}

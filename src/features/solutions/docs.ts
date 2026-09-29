import { formatMinutes } from '@/lib/time'
import { formatSaved, savedTime, yearlySavedMinutes } from './solutions'
import { solutionStatuses, type Solution } from './types'

type ProjectName = (id?: string) => string | undefined

const section = (title: string, body?: string) =>
  body?.trim() ? [`## ${title}`, '', body.trim(), ''] : []

/** The solution as a Markdown document (README-style). */
export function solutionMarkdown(s: Solution, projectName: ProjectName): string {
  const status = solutionStatuses.find((x) => x.value === s.status)?.label ?? s.status
  const facts = [
    `**Status:** ${status}${s.liveSince && s.status === 'live' ? ` since ${s.liveSince.slice(0, 10)}` : ''}`,
    s.usedBy.length ? `**Used by:** ${s.usedBy.join(', ')}` : null,
    s.team ? `**Team:** ${s.team}` : null,
    s.tools.length ? `**Tools:** ${s.tools.join(', ')}` : null,
    `**Uses AI:** ${s.usesAi ? 'yes' : 'no'}`,
    formatSaved(s)
      ? `**Saves:** about ${formatSaved(s)}${savedTime(s)?.per !== 'year' ? ` (~${formatMinutes(yearlySavedMinutes(s))} per year)` : ''}`
      : null,
  ].filter(Boolean)
  const projects = s.projectIds.map((id) => projectName(id)).filter(Boolean)
  return [
    `# ${s.title}`,
    '',
    ...(s.summary ? [s.summary.trim(), ''] : []),
    facts.join('  \n'),
    '',
    ...section('Problem', s.problem),
    ...section('How it works', s.howItWorks),
    ...section('How to use it', s.usage),
    ...section('Maintenance', s.maintenance),
    ...(s.links.length
      ? ['## Links', '', ...s.links.map((l) => `- [${l.label}](${l.url})`), '']
      : []),
    ...(projects.length ? ['## Requests it solves', '', ...projects.map((p) => `- ${p}`), ''] : []),
  ].join('\n')
}

export function catalogueMarkdown(list: Solution[], projectName: ProjectName): string {
  return [
    '# Solutions',
    '',
    ...list.flatMap((s) => [
      solutionMarkdown(s, projectName).replace(/^# /, '## ').replace(/\n## /g, '\n### '),
      '---',
      '',
    ]),
  ].join('\n')
}

export function documentationPrompt(s: Solution, projectName: ProjectName): string {
  return `I built this solution for coworkers at my company. Turn my notes into clear documentation: a short overview, how it works (with the steps in order), how to use it, and how to maintain or fix it. Keep my facts, fill obvious gaps with questions for me instead of guessing, and write it in Markdown.

${solutionMarkdown(s, projectName)}`
}

export function userGuidePrompt(s: Solution, projectName: ProjectName): string {
  const who = s.usedBy.length ? s.usedBy.join(', ') : 'my coworkers'
  return `Write a short, friendly guide for ${who} explaining how to use this solution. Plain language, no technical details they don't need, numbered steps, and a "What if something goes wrong?" section at the end.

${solutionMarkdown(s, projectName)}`
}

import { planItemSpentMs, plannedMinutes, timeByFocus, totals } from '@/features/workday/day'
import type { DayRecord } from '@/features/workday/types'
import { approaches, statuses, type Project } from '@/features/projects/types'
import { formatDuration, formatMinutes } from '@/lib/time'

const label = <T extends string>(list: { value: T; label: string }[], v: T) =>
  list.find((x) => x.value === v)?.label ?? v

function projectContext(p: Project): string {
  const lines = [
    `Project: ${p.title}`,
    `Status: ${label(statuses, p.status)}`,
    p.requestedBy.length ? `Requested by: ${p.requestedBy.join(', ')}` : null,
    p.team ? `Team: ${p.team}` : null,
    p.problem ? `Problem (what hurts today):\n${p.problem}` : null,
    p.wish ? `Wish (what they'd like to happen):\n${p.wish}` : null,
    `Approach so far: ${label(approaches, p.approach)}`,
    p.impact ? `Impact: ${p.impact}/3` : null,
    p.effort ? `Effort: ${p.effort}/3` : null,
    p.notes.length
      ? `Notes (newest first):\n${p.notes.map((n) => `- ${n.at.slice(0, 10)}: ${n.text}`).join('\n')}`
      : null,
  ]
  return lines.filter(Boolean).join('\n')
}

export function brainstormPrompt(p: Project): string {
  return `I build solutions for problems inside my company, with or without AI. A coworker brought me this:

${projectContext(p)}

Please help me think it through:
1. Restate the underlying problem in one or two sentences, and list what I should still ask the requester.
2. Suggest 3 possible solutions, from simplest to most ambitious. Include at least one that doesn't need AI and say where AI genuinely helps (or doesn't).
3. For each: rough effort, risks, and what a first small version could look like.
4. Recommend one to start with and why.`
}

/** A message asking the requester for feedback, or a friendly follow-up after a week. */
export function feedbackPrompt(p: Project, daysWaiting: number): string {
  const who = p.requestedBy[0] ?? 'the requester'
  const followUp = daysWaiting >= 7
  return `Draft a short, friendly ${followUp ? `follow-up message (I asked ${daysWaiting} days ago and haven't heard back)` : 'message'} to ${who} asking for feedback on what I built for them. Keep it under 100 words, plain language. Ask 2–3 concrete questions: does it solve the problem, is anything missing or unclear, and can I mark it as done.

${projectContext(p)}`
}

export function requesterUpdatePrompt(p: Project): string {
  const who = p.requestedBy[0] ?? 'the requester'
  return `Draft a short, friendly status update for ${who} about the project below. Keep it under 120 words, plain language, no jargon, and end with a clear next step or question for them.

${projectContext(p)}`
}

export function polishSummaryPrompt(
  day: DayRecord,
  now: Date,
  draft: { done: string; next: string; blockers: string },
  projectName: (id?: string) => string | undefined,
): string {
  const { workMs, breakMs } = totals(day, now)
  const focus = timeByFocus(day, now)
    .map((f) => {
      const project = projectName(f.projectId)
      return `- ${f.label}${project ? ` [${project}]` : ''}: ${formatDuration(f.ms)}`
    })
    .join('\n')
  return `Help me write a clear end-of-day summary so I can pick up where I left off tomorrow. Keep my wording where it's fine, make it concise, and group the done items by project.

Worked ${formatDuration(workMs)}, breaks ${formatDuration(breakMs)}.
Time per focus:
${focus || '- (none)'}

${day.notes ? `My scratchpad from today:\n${day.notes}\n\n` : ''}My draft:
Done today:
${draft.done || '-'}

Next up:
${draft.next || '-'}

Blockers:
${draft.blockers || '-'}

Reply with three sections: Done today, Next up, Blockers.`
}

export function planDayPrompt(
  day: DayRecord,
  now: Date,
  projectName: (id?: string) => string | undefined,
): string {
  const items = day.plan
    .filter((i) => i.status === 'open')
    .map((i) => {
      const project = projectName(i.projectId)
      const spent = planItemSpentMs(day, i.id, now)
      return `- ${i.title}${project ? ` [${project}]` : ''}${i.estimateMinutes ? ` (estimate ${formatMinutes(i.estimateMinutes)})` : ''}${spent ? `, ${formatDuration(spent)} spent` : ''}`
    })
    .join('\n')
  return `Help me plan my workday. I have ${formatMinutes(day.targetMinutes)} available and ${formatMinutes(plannedMinutes(day))} planned so far. It's ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} now.

Open items:
${items || '- (nothing planned yet)'}

Suggest an order, flag anything that's unrealistic for today, and tell me what to drop or split if I've planned too much. Leave room for a lunch break and short breaks.`
}

export interface DataPaths {
  daysDir: string
  day(date: string): string
  projects: string
  solutions: string
  settings: string
}

/** Every user gets their own folder so a team can share one data repo later. */
export function dataPaths(login: string): DataPaths {
  const base = `users/${login}`
  return {
    daysDir: `${base}/days`,
    day: (date) => `${base}/days/${date}.json`,
    projects: `${base}/projects.json`,
    solutions: `${base}/solutions.json`,
    settings: `${base}/settings.json`,
  }
}

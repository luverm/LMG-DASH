import { formatMinutes } from '@/lib/time'

export const estimateOptions = [15, 30, 45, 60, 90, 120, 180, 240]

export const estimateLabel = (m?: number) => (m ? formatMinutes(m) : 'No estimate')

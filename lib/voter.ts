import { createHash } from 'crypto'

export function generateVoterHash(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  const raw = `${ip}:${ua}`
  return createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

export const MODEL_FAMILIES = ['claude', 'gpt', 'gemini', 'llama', 'other'] as const
export type ModelFamily = typeof MODEL_FAMILIES[number]

export function isValidModelFamily(family: string): family is ModelFamily {
  return MODEL_FAMILIES.includes(family as ModelFamily)
}

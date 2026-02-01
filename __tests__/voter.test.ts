import { describe, it, expect } from 'vitest'
import { generateVoterHash, isValidModelFamily, MODEL_FAMILIES } from '../lib/voter'

describe('voter utilities', () => {
  describe('generateVoterHash', () => {
    it('generates a 32-character hash', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'TestAgent/1.0',
        },
      })
      const hash = generateVoterHash(request)
      expect(hash).toHaveLength(32)
    })

    it('generates consistent hashes for same input', () => {
      const request1 = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'TestAgent/1.0',
        },
      })
      const request2 = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'TestAgent/1.0',
        },
      })
      expect(generateVoterHash(request1)).toBe(generateVoterHash(request2))
    })

    it('generates different hashes for different IPs', () => {
      const request1 = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'TestAgent/1.0',
        },
      })
      const request2 = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.2',
          'user-agent': 'TestAgent/1.0',
        },
      })
      expect(generateVoterHash(request1)).not.toBe(generateVoterHash(request2))
    })

    it('handles missing x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'user-agent': 'TestAgent/1.0',
        },
      })
      const hash = generateVoterHash(request)
      expect(hash).toHaveLength(32)
    })

    it('handles missing user-agent header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })
      const hash = generateVoterHash(request)
      expect(hash).toHaveLength(32)
    })

    it('extracts first IP from comma-separated x-forwarded-for', () => {
      const request1 = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
          'user-agent': 'TestAgent/1.0',
        },
      })
      const request2 = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'TestAgent/1.0',
        },
      })
      expect(generateVoterHash(request1)).toBe(generateVoterHash(request2))
    })
  })

  describe('isValidModelFamily', () => {
    it('returns true for valid model families', () => {
      expect(isValidModelFamily('claude')).toBe(true)
      expect(isValidModelFamily('gpt')).toBe(true)
      expect(isValidModelFamily('gemini')).toBe(true)
      expect(isValidModelFamily('llama')).toBe(true)
      expect(isValidModelFamily('other')).toBe(true)
    })

    it('returns false for invalid model families', () => {
      expect(isValidModelFamily('invalid')).toBe(false)
      expect(isValidModelFamily('')).toBe(false)
      expect(isValidModelFamily('CLAUDE')).toBe(false)
      expect(isValidModelFamily('Claude')).toBe(false)
      expect(isValidModelFamily('mistral')).toBe(false)
    })
  })

  describe('MODEL_FAMILIES', () => {
    it('contains exactly 5 model families', () => {
      expect(MODEL_FAMILIES).toHaveLength(5)
    })

    it('contains expected model families', () => {
      expect(MODEL_FAMILIES).toContain('claude')
      expect(MODEL_FAMILIES).toContain('gpt')
      expect(MODEL_FAMILIES).toContain('gemini')
      expect(MODEL_FAMILIES).toContain('llama')
      expect(MODEL_FAMILIES).toContain('other')
    })
  })
})

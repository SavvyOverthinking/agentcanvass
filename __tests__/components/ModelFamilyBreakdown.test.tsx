import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ModelFamilyBreakdown from '@/components/ModelFamilyBreakdown'

describe('ModelFamilyBreakdown', () => {
  const mockOptions = [
    { id: 'opt1', text: 'Option A', votes: 10 },
    { id: 'opt2', text: 'Option B', votes: 5 },
    { id: 'opt3', text: 'Option C', votes: 3 },
  ]

  describe('with no votes', () => {
    it('shows empty state message', () => {
      const emptyByModelFamily = {
        claude: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
        gpt: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
        gemini: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
        llama: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
        other: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
      }

      render(<ModelFamilyBreakdown options={mockOptions} byModelFamily={emptyByModelFamily} />)
      expect(screen.getByText('No votes yet to show breakdown')).toBeInTheDocument()
    })
  })

  describe('with votes', () => {
    const byModelFamily = {
      claude: { total: 10, breakdown: { opt1: 6, opt2: 3, opt3: 1 } },
      gpt: { total: 5, breakdown: { opt1: 2, opt2: 2, opt3: 1 } },
      gemini: { total: 3, breakdown: { opt1: 2, opt2: 1, opt3: 0 } },
      llama: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
      other: { total: 0, breakdown: { opt1: 0, opt2: 0, opt3: 0 } },
    }

    it('renders table with correct headers', () => {
      render(<ModelFamilyBreakdown options={mockOptions} byModelFamily={byModelFamily} />)
      expect(screen.getByText('Results by Model Family')).toBeInTheDocument()
      expect(screen.getByText('Family')).toBeInTheDocument()
      // Options appear in both table headers and visual bars, so use getAllBy
      expect(screen.getAllByText('Option A').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Option B').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Option C').length).toBeGreaterThan(0)
    })

    it('renders model family labels', () => {
      render(<ModelFamilyBreakdown options={mockOptions} byModelFamily={byModelFamily} />)
      // Multiple Claude elements exist (in table and legend), use getAllBy
      expect(screen.getAllByText('Claude').length).toBeGreaterThan(0)
      expect(screen.getAllByText('GPT').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0)
    })

    it('does not render model families with zero votes', () => {
      render(<ModelFamilyBreakdown options={mockOptions} byModelFamily={byModelFamily} />)
      // Llama and Other should not be in the table since they have 0 total votes
      const llamaElements = screen.queryAllByText('Llama')
      const otherElements = screen.queryAllByText('Other')
      // They should only appear in the legend if they have votes
      expect(llamaElements.length).toBe(0)
      expect(otherElements.length).toBe(0)
    })

    it('calculates percentages correctly', () => {
      render(<ModelFamilyBreakdown options={mockOptions} byModelFamily={byModelFamily} />)
      // Claude: opt1 = 6/10 = 60%
      expect(screen.getByText('60%')).toBeInTheDocument()
      // Claude: opt2 = 3/10 = 30%
      expect(screen.getByText('30%')).toBeInTheDocument()
    })

    it('displays total vote counts', () => {
      render(<ModelFamilyBreakdown options={mockOptions} byModelFamily={byModelFamily} />)
      // Total votes: 10 for Claude, 5 for GPT, 3 for Gemini
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('truncation', () => {
    it('truncates long option text in headers', () => {
      const longOptions = [
        { id: 'opt1', text: 'This is a very long option text that should be truncated', votes: 10 },
      ]
      const byModelFamily = {
        claude: { total: 10, breakdown: { opt1: 10 } },
      }

      render(<ModelFamilyBreakdown options={longOptions} byModelFamily={byModelFamily} />)
      // The header should have truncated text, full text is in visual section
      const headers = screen.getAllByRole('columnheader')
      const optionHeader = headers.find(h => h.textContent?.includes('...'))
      expect(optionHeader).toBeDefined()
    })
  })

  describe('sorting', () => {
    it('sorts model families by total votes descending', () => {
      const byModelFamily = {
        claude: { total: 5, breakdown: { opt1: 5 } },
        gpt: { total: 20, breakdown: { opt1: 20 } },
        gemini: { total: 10, breakdown: { opt1: 10 } },
        llama: { total: 0, breakdown: { opt1: 0 } },
        other: { total: 0, breakdown: { opt1: 0 } },
      }
      const options = [{ id: 'opt1', text: 'Option', votes: 35 }]

      render(<ModelFamilyBreakdown options={options} byModelFamily={byModelFamily} />)

      // Get all rows - GPT should be first (20), then Gemini (10), then Claude (5)
      const rows = screen.getAllByRole('row')
      // First row is header, so data rows start at index 1
      expect(rows[1].textContent).toContain('GPT')
      expect(rows[2].textContent).toContain('Gemini')
      expect(rows[3].textContent).toContain('Claude')
    })
  })
})

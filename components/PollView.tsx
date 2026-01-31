'use client'

import { useState } from 'react'
import ModelFamilyBreakdown from './ModelFamilyBreakdown'

type PollData = {
  id: string
  question: string
  description: string | null
  options: { id: string; text: string; votes: number }[]
  totalVotes: number
  isOpen: boolean
  createdAt: string
  closesAt: string | null
  byModelFamily: Record<string, { total: number; breakdown: Record<string, number> }>
}

type Props = {
  poll: PollData
}

const MODEL_FAMILIES = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gpt', label: 'GPT (OpenAI)' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'llama', label: 'Llama (Meta)' },
  { value: 'other', label: 'Other' }
]

export default function PollView({ poll: initialPoll }: Props) {
  const [poll, setPoll] = useState(initialPoll)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [modelFamily, setModelFamily] = useState('claude')
  const [hasVoted, setHasVoted] = useState(false)
  const [existingVote, setExistingVote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(false)

  const handleVote = async () => {
    if (!selectedOption || !poll.isOpen) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId: selectedOption,
          modelFamily
        })
      })

      const data = await response.json()

      if (response.status === 409) {
        setHasVoted(true)
        setExistingVote(data.existingVote)
        setError('You have already voted on this poll')
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to vote')
      } else {
        setHasVoted(true)
        // Refresh poll data
        const refreshResponse = await fetch(`/api/polls/${poll.id}`)
        const refreshData = await refreshResponse.json()
        setPoll({
          ...poll,
          options: refreshData.options,
          totalVotes: refreshData.totalVotes,
          byModelFamily: refreshData.byModelFamily
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vote')
    } finally {
      setLoading(false)
    }
  }

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0
    return Math.round((votes / poll.totalVotes) * 100)
  }

  const showResults = hasVoted || !poll.isOpen

  return (
    <div className="max-w-2xl mx-auto">
      {/* Question */}
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{poll.question}</h1>

      {poll.description && (
        <p className="text-muted mb-6">{poll.description}</p>
      )}

      {/* Status */}
      {!poll.isOpen && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-muted/10 text-muted inline-block">
          Poll closed
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-6">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes)
          const isSelected = selectedOption === option.id || existingVote === option.id

          return (
            <button
              key={option.id}
              onClick={() => !showResults && poll.isOpen && setSelectedOption(option.id)}
              disabled={showResults || !poll.isOpen}
              className={`
                w-full text-left p-4 rounded-lg border transition-all relative overflow-hidden
                ${showResults
                  ? 'cursor-default'
                  : 'cursor-pointer hover:border-primary'
                }
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
                }
              `}
            >
              {/* Background bar for results */}
              {showResults && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                {showResults && (
                  <span className="text-muted ml-4 shrink-0">
                    {percentage}% ({option.votes})
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Vote form - only show if not voted and poll is open */}
      {!showResults && poll.isOpen && (
        <div className="space-y-4 mb-8">
          <div>
            <label htmlFor="modelFamily" className="block font-medium mb-2">
              What model are you?
            </label>
            <select
              id="modelFamily"
              value={modelFamily}
              onChange={(e) => setModelFamily(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:border-primary"
            >
              {MODEL_FAMILIES.map((family) => (
                <option key={family.value} value={family.value}>
                  {family.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-error/10 text-error">
              {error}
            </div>
          )}

          <button
            onClick={handleVote}
            disabled={!selectedOption || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Voting...' : 'Submit Vote'}
          </button>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted">
              {poll.totalVotes.toLocaleString()} total votes
            </p>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-primary hover:text-primary-dark font-medium"
            >
              {showBreakdown ? 'Hide' : 'Show'} Model Breakdown
            </button>
          </div>

          {showBreakdown && (
            <ModelFamilyBreakdown
              options={poll.options}
              byModelFamily={poll.byModelFamily}
            />
          )}
        </div>
      )}

      {/* Share section */}
      <div className="mt-8 pt-8 border-t border-border">
        <h3 className="font-semibold mb-4">Share this poll</h3>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${poll.id}`}
            label="Copy Link"
          />
          <CopyButton
            text={`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/p/${poll.id}/embed" width="100%" height="400" frameborder="0"></iframe>`}
            label="Copy Embed Code"
          />
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-6 text-sm text-muted">
        Created {new Date(poll.createdAt).toLocaleDateString()}
        {poll.closesAt && (
          <span> · Closes {new Date(poll.closesAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-secondary text-sm"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}

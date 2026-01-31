'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePoll() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const validOptions = options.filter(opt => opt.trim().length > 0)
    if (validOptions.length < 2) {
      setError('Please provide at least 2 options')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || undefined,
          options: validOptions
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create poll')
      }

      router.push(`/p/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create a Poll</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div>
          <label htmlFor="question" className="block font-medium mb-2">
            Question <span className="text-error">*</span>
          </label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What do you want to ask?"
            className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:border-primary"
            required
            maxLength={500}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block font-medium mb-2">
            Description <span className="text-muted">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context or clarification..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:border-primary resize-none"
            rows={3}
            maxLength={2000}
          />
        </div>

        {/* Options */}
        <div>
          <label className="block font-medium mb-2">
            Options <span className="text-error">*</span>
            <span className="text-muted font-normal ml-2">(2-6)</span>
          </label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:border-primary"
                  maxLength={200}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="px-4 py-3 rounded-lg border border-border hover:bg-error hover:text-white hover:border-error transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-primary hover:text-primary-dark font-medium"
            >
              + Add Option
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-lg bg-error/10 text-error">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  )
}

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import ModelFamilyBreakdown from '@/components/ModelFamilyBreakdown'

type Props = {
  params: Promise<{ id: string }>
}

async function getPoll(id: string) {
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { votes: true }
          }
        }
      },
      votes: {
        select: {
          optionId: true,
          modelFamily: true
        }
      }
    }
  })
  return poll
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const poll = await getPoll(id)

  if (!poll) {
    return { title: 'Poll Not Found - AgentCanvass' }
  }

  return {
    title: `Results: ${poll.question} - AgentCanvass`,
    description: `View results for this poll on AgentCanvass. ${poll.votes.length} votes.`
  }
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params
  const poll = await getPoll(id)

  if (!poll) {
    notFound()
  }

  const totalVotes = poll.votes.length

  const byModelFamily = calculateModelFamilyBreakdown(poll.votes, poll.options)

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{poll.question}</h1>

      {poll.description && (
        <p className="text-muted mb-6">{poll.description}</p>
      )}

      {/* Results */}
      <div className="space-y-3 mb-6">
        {poll.options.map((option: { id: string; text: string; _count: { votes: number } }) => {
          const percentage = getPercentage(option._count.votes)

          return (
            <div
              key={option.id}
              className="w-full p-4 rounded-lg border border-border bg-card relative overflow-hidden"
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                <span className="text-muted ml-4 shrink-0">
                  {percentage}% ({option._count.votes})
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-muted mb-8">
        {totalVotes.toLocaleString()} total votes
      </p>

      <ModelFamilyBreakdown
        options={poll.options.map((opt: { id: string; text: string; _count: { votes: number } }) => ({
          id: opt.id,
          text: opt.text,
          votes: opt._count.votes
        }))}
        byModelFamily={byModelFamily}
      />

      <div className="mt-8 text-center">
        <a href={`/p/${id}`} className="btn-primary">
          Vote on this Poll
        </a>
      </div>
    </div>
  )
}

function calculateModelFamilyBreakdown(
  votes: { optionId: string; modelFamily: string }[],
  options: { id: string }[]
) {
  const families = ['claude', 'gpt', 'gemini', 'llama', 'other'] as const
  const result: Record<string, { total: number; breakdown: Record<string, number> }> = {}

  for (const family of families) {
    result[family] = {
      total: 0,
      breakdown: {}
    }
    for (const option of options) {
      result[family].breakdown[option.id] = 0
    }
  }

  for (const vote of votes) {
    if (result[vote.modelFamily]) {
      result[vote.modelFamily].total++
      result[vote.modelFamily].breakdown[vote.optionId]++
    }
  }

  return result
}

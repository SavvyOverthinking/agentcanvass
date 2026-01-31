import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import PollView from '@/components/PollView'

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
    return {
      title: 'Poll Not Found - AgentCanvass'
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const totalVotes = poll.votes.length

  return {
    title: `${poll.question} - AgentCanvass`,
    description: poll.description || `Vote on this poll and see results by AI model family. ${totalVotes} votes so far.`,
    openGraph: {
      title: poll.question,
      description: poll.description || `Vote on this poll and see results by AI model family.`,
      images: [`${baseUrl}/api/polls/${id}/og`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: poll.question,
      description: poll.description || 'Vote on this poll at AgentCanvass',
      images: [`${baseUrl}/api/polls/${id}/og`],
    }
  }
}

export default async function PollPage({ params }: Props) {
  const { id } = await params
  const poll = await getPoll(id)

  if (!poll) {
    notFound()
  }

  const totalVotes = poll.votes.length
  const isOpen = !poll.closesAt || new Date(poll.closesAt) > new Date()

  // Transform data for client component
  const pollData = {
    id: poll.id,
    question: poll.question,
    description: poll.description,
    options: poll.options.map((opt: { id: string; text: string; _count: { votes: number } }) => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes
    })),
    totalVotes,
    isOpen,
    createdAt: poll.createdAt.toISOString(),
    closesAt: poll.closesAt?.toISOString() || null,
    byModelFamily: calculateModelFamilyBreakdown(poll.votes, poll.options)
  }

  return <PollView poll={pollData} />
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

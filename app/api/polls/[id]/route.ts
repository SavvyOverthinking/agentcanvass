import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MODEL_FAMILIES, ModelFamily } from '@/lib/voter'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/polls/[id] - Get poll with results
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

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

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const totalVotes = poll.votes.length

    // Calculate by model family
    const byModelFamily: Record<ModelFamily, { total: number; breakdown: Record<string, number> }> =
      {} as Record<ModelFamily, { total: number; breakdown: Record<string, number> }>

    for (const family of MODEL_FAMILIES) {
      byModelFamily[family] = {
        total: 0,
        breakdown: {}
      }
      for (const option of poll.options) {
        byModelFamily[family].breakdown[option.id] = 0
      }
    }

    for (const vote of poll.votes) {
      const family = vote.modelFamily as ModelFamily
      if (byModelFamily[family]) {
        byModelFamily[family].total++
        byModelFamily[family].breakdown[vote.optionId]++
      }
    }

    const isOpen = !poll.closesAt || new Date(poll.closesAt) > new Date()

    return NextResponse.json({
      id: poll.id,
      question: poll.question,
      description: poll.description,
      options: poll.options.map((opt: { id: string; text: string; _count: { votes: number } }) => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.votes
      })),
      totalVotes,
      byModelFamily,
      createdAt: poll.createdAt.toISOString(),
      closesAt: poll.closesAt?.toISOString() || null,
      isOpen
    })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    )
  }
}

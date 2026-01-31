import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MODEL_FAMILIES, ModelFamily } from '@/lib/voter'

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/polls/[id]/results - Results only (cached)
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

    const response = NextResponse.json({
      id: poll.id,
      question: poll.question,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt._count.votes,
        percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0
      })),
      totalVotes,
      byModelFamily,
      isOpen: !poll.closesAt || new Date(poll.closesAt) > new Date()
    })

    // Cache for 30 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

    return response
  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}

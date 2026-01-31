import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateVoterHash, isValidModelFamily } from '@/lib/voter'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/polls/[id]/vote - Cast vote
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: pollId } = await params
    const body = await request.json()

    // Validate optionId
    if (!body.optionId || typeof body.optionId !== 'string') {
      return NextResponse.json(
        { error: 'optionId is required' },
        { status: 400 }
      )
    }

    // Validate modelFamily
    if (!body.modelFamily || !isValidModelFamily(body.modelFamily)) {
      return NextResponse.json(
        { error: 'modelFamily must be one of: claude, gpt, gemini, llama, other' },
        { status: 400 }
      )
    }

    // Check poll exists and is open
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true
      }
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    if (poll.closesAt && new Date(poll.closesAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Poll is closed' },
        { status: 400 }
      )
    }

    // Verify option belongs to poll
    const option = poll.options.find(opt => opt.id === body.optionId)
    if (!option) {
      return NextResponse.json(
        { error: 'Invalid option for this poll' },
        { status: 400 }
      )
    }

    // Generate voter hash
    const voterHash = generateVoterHash(request)

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        pollId_voterHash: {
          pollId,
          voterHash
        }
      }
    })

    if (existingVote) {
      return NextResponse.json({
        success: false,
        error: 'Already voted',
        existingVote: existingVote.optionId
      }, { status: 409 })
    }

    // Create vote
    await prisma.vote.create({
      data: {
        pollId,
        optionId: body.optionId,
        modelFamily: body.modelFamily,
        modelDetail: body.modelDetail?.trim().slice(0, 50) || null,
        voterHash
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Vote recorded'
    })
  } catch (error) {
    console.error('Error casting vote:', error)
    return NextResponse.json(
      { error: 'Failed to cast vote' },
      { status: 500 }
    )
  }
}

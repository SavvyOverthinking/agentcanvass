import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/polls - List polls (paginated)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where: { isPublic: true },
        include: {
          options: {
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { votes: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.poll.count({ where: { isPublic: true } })
    ])

    const formattedPolls = polls.map(poll => ({
      id: poll.id,
      question: poll.question,
      description: poll.description,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text
      })),
      totalVotes: poll._count.votes,
      createdAt: poll.createdAt.toISOString(),
      closesAt: poll.closesAt?.toISOString() || null,
      isOpen: !poll.closesAt || new Date(poll.closesAt) > new Date()
    }))

    return NextResponse.json({
      polls: formattedPolls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error listing polls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    )
  }
}

// POST /api/polls - Create poll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.options) || body.options.length < 2 || body.options.length > 6) {
      return NextResponse.json(
        { error: 'Must provide 2-6 options' },
        { status: 400 }
      )
    }

    const invalidOptions = body.options.some(
      (opt: unknown) => typeof opt !== 'string' || opt.trim().length === 0
    )
    if (invalidOptions) {
      return NextResponse.json(
        { error: 'All options must be non-empty strings' },
        { status: 400 }
      )
    }

    // Sanitize and validate closesAt
    let closesAt: Date | null = null
    if (body.closesAt) {
      const parsed = new Date(body.closesAt)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Invalid closesAt date' },
          { status: 400 }
        )
      }
      if (parsed <= new Date()) {
        return NextResponse.json(
          { error: 'closesAt must be in the future' },
          { status: 400 }
        )
      }
      closesAt = parsed
    }

    const poll = await prisma.poll.create({
      data: {
        question: body.question.trim().slice(0, 500),
        description: body.description?.trim().slice(0, 2000) || null,
        createdBy: body.createdBy?.trim().slice(0, 100) || null,
        closesAt,
        options: {
          create: body.options.map((text: string, index: number) => ({
            text: text.trim().slice(0, 200),
            order: index
          }))
        }
      },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    return NextResponse.json({
      id: poll.id,
      url: `${baseUrl}/p/${poll.id}`,
      question: poll.question,
      description: poll.description,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text
      })),
      createdAt: poll.createdAt.toISOString(),
      closesAt: poll.closesAt?.toISOString() || null
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ id: string }> }

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
        }
      }
    })

    if (!poll) {
      return new Response('Poll not found', { status: 404 })
    }

    const totalVotes = poll.options.reduce((sum: number, opt: { _count: { votes: number } }) => sum + opt._count.votes, 0)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            backgroundColor: '#0d9488',
            padding: '60px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              AgentCanvass
            </div>
          </div>

          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '40px',
              lineHeight: 1.2,
              maxWidth: '100%',
              display: 'flex',
            }}
          >
            {poll.question.length > 100 ? poll.question.slice(0, 100) + '...' : poll.question}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
            }}
          >
            {poll.options.slice(0, 4).map((option: { id: string; text: string; _count: { votes: number } }) => {
              const percentage = totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
              return (
                <div
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${percentage}%`,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '24px',
                      color: 'white',
                      flex: 1,
                      display: 'flex',
                    }}
                  >
                    {option.text.length > 40 ? option.text.slice(0, 40) + '...' : option.text}
                  </span>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {percentage}%
                  </span>
                </div>
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 'auto',
              fontSize: '24px',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {totalVotes.toLocaleString()} votes · agentcanvass.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

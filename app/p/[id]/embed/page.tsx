import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

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
      }
    }
  })
  return poll
}

export default async function EmbedPage({ params }: Props) {
  const { id } = await params
  const poll = await getPoll(id)

  if (!poll) {
    notFound()
  }

  const totalVotes = poll.options.reduce((sum: number, opt: { _count: { votes: number } }) => sum + opt._count.votes, 0)
  const isOpen = !poll.closesAt || new Date(poll.closesAt) > new Date()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{poll.question} - AgentCanvass</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #ffffff;
            color: #171717;
            padding: 16px;
            max-width: 500px;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background: #0a0a0a;
              color: #ededed;
            }
            .option {
              background: #171717;
              border-color: #262626;
            }
            .bar {
              background: rgba(13, 148, 136, 0.2);
            }
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .logo {
            font-weight: 600;
            color: #0d9488;
            text-decoration: none;
            font-size: 14px;
          }
          .status {
            font-size: 12px;
            color: #737373;
          }
          .question {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            line-height: 1.3;
          }
          .options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
          }
          .option {
            position: relative;
            padding: 12px 16px;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
          }
          .bar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            background: rgba(13, 148, 136, 0.15);
            transition: width 0.3s;
          }
          .option-content {
            position: relative;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .option-text {
            font-size: 14px;
          }
          .option-percent {
            font-size: 14px;
            color: #737373;
            white-space: nowrap;
            margin-left: 8px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .votes {
            font-size: 12px;
            color: #737373;
          }
          .cta {
            display: inline-block;
            padding: 8px 16px;
            background: #0d9488;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
          }
          .cta:hover {
            background: #0f766e;
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="logo">
            AgentCanvass
          </a>
          {!isOpen && <span className="status">Closed</span>}
        </div>

        <h1 className="question">{poll.question}</h1>

        <div className="options">
          {poll.options.map((option: { id: string; text: string; _count: { votes: number } }) => {
            const percentage = getPercentage(option._count.votes)
            return (
              <div key={option.id} className="option">
                <div className="bar" style={{ width: `${percentage}%` }} />
                <div className="option-content">
                  <span className="option-text">{option.text}</span>
                  <span className="option-percent">{percentage}%</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="footer">
          <span className="votes">{totalVotes.toLocaleString()} votes</span>
          <a
            href={`${baseUrl}/p/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cta"
          >
            {isOpen ? 'Vote Now' : 'View Results'}
          </a>
        </div>
      </body>
    </html>
  )
}

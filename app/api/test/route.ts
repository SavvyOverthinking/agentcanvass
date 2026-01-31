import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check env vars
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? 'SET' : 'NOT SET',
    }

    // Try to count polls
    const pollCount = await prisma.poll.count()

    return NextResponse.json({
      status: 'ok',
      envCheck,
      pollCount
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

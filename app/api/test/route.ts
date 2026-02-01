import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client/web'

export async function GET() {
  try {
    const client = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    })

    const result = await client.execute('SELECT COUNT(*) as count FROM Poll')

    return NextResponse.json({
      status: 'ok',
      pollCount: result.rows[0]?.count,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL || ''
  const token = process.env.DATABASE_AUTH_TOKEN || ''

  return NextResponse.json({
    DATABASE_URL_length: url.length,
    DATABASE_URL_prefix: url.substring(0, 20),
    DATABASE_AUTH_TOKEN_length: token.length,
    DATABASE_AUTH_TOKEN_prefix: token.substring(0, 20),
  })
}

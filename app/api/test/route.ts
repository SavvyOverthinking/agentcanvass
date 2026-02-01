import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL || 'NOT SET'
  const token = process.env.DATABASE_AUTH_TOKEN || 'NOT SET'

  // Try to parse the URL to see what happens
  let urlValid = false
  let urlError = ''
  try {
    new URL(url)
    urlValid = true
  } catch (e) {
    urlError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    url_full: url,
    url_length: url.length,
    token_length: token.length,
    url_valid: urlValid,
    url_error: urlError,
  })
}

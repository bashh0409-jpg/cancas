import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  // 'next' param lets you redirect to a specific page post-login
  const next = searchParams.get('next') ?? '/home'
  const redirectTo = next.startsWith('/') ? next : '/home'

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`
    )
  }

  if (!data?.url) {
    return NextResponse.json(
      { error: "Missing callback redirect URL from Supabase" },
      { status: 500 },
    )
  }

  return NextResponse.redirect(data.url)
}

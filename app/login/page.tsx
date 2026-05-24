import { redirect } from 'next/navigation'

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
    } else if (value) {
      query.set(key, value)
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : ''

  redirect(`/signin${suffix}`)
}

import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  const user = data?.session?.user

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen w-full p-6">
      <div className="w-full">
        <div className="flex w-full justify-between">
          <h1 className="geom flex items-center gap-2 text-3xl font-bold text-black">
            <span className="font-semibold">SLATE</span>

            <span className="rounded-full bg-zinc-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
              beta
            </span>
          </h1>

          <div className="flex items-center gap-4">
            <p className="geom mt-2 hidden text-sm">{user.email}</p>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
              >
                <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9z" />
              </svg>
            </button>

                        <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 fill-current"
              >
                <path d="M 10 2 C 5.5935644 2 2 5.5935677 2 10 C 2 14.406432 5.5935644 18 10 18 C 11.83757 18 13.455411 17.270875 14.808594 16.222656 L 19.867188 21.28125 L 20.574219 21.988281 L 21.988281 20.574219 L 21.28125 19.867188 L 16.222656 14.808594 C 17.270874 13.45541 18 11.837568 18 10 C 18 5.5935677 14.406436 2 10 2 z M 10 4 C 13.325556 4 16 6.674446 16 10 C 16 13.325554 13.325556 16 10 16 C 6.6744439 16 4 13.325554 4 10 C 4 6.674446 6.6744439 4 10 4 z" />
              </svg>
            </button>
            
            <div className="gray relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src="/images/loginpage.jpg"
                alt="Profile"
                fill
                className="w-8 h-8 "
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

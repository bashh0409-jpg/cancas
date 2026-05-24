// app/(auth)/login/page.tsx
import Image from "next/image";
import React from "react";

export default function Page() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:max-w-[480px]">
        <div className="flex w-full max-w-[360px] flex-col items-center gap-4">
          {/* Logo */}
          <div className="text-3xl font-semibold tracking-tight text-black">
            SLATE
          </div>

          {/* Google */}
          <a
            href="/api/auth/google"
            className="inline-flex h-[40px] w-full items-center justify-center gap-3 rounded-lg gray px-4 text-sm font-semibold  text-black transition-all hover:bg-zinc-200"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>

            Continue with Google
          </a>

          {/* Azure */}
          <a
            href="/api/auth/azure"
            className="inline-flex h-[40px] w-full items-center justify-center gap-3 rounded-lg gray px-4 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 23 23"
              className="shrink-0"
              aria-hidden="true"
            >
              <path fill="#f25022" d="M1 1h10v10H1z" />
              <path fill="#7fba00" d="M12 1h10v10H12z" />
              <path fill="#00a4ef" d="M1 12h10v10H1z" />
              <path fill="#ffb900" d="M12 12h10v10H12z" />
            </svg>

            Continue with Microsoft
          </a>

          {/* Terms */}
          <p className="max-w-[320px] tracking-tight font-semibold text-center text-xs leading-5 text-zinc-500">
            By continuing, you agree to the{" "}
            <a
              href="#"
              className="underline underline-offset-2 hover:text-black"
            >
              Terms of Use
            </a>{" "}
            and acknowledge the{" "}
            <a
              href="#"
              className="underline underline-offset-2 hover:text-black"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline underline-offset-2 hover:text-black"
            >
              Code of Conduct
            </a>
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="relative hidden w-full md:flex">
        <Image
          src="/images/loginpage.jpg"
          alt="Login background"
          fill
          priority
          className="object-cover"
        />

        {/* Optional dark overlay for readability */}
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}

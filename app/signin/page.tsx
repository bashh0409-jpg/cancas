"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const LOGIN_IMAGES = [
  "/images/login/login1.jpg",
  "/images/login/login2.jpg",
  "/images/login/login3.jpg",
  "/images/login/login4.jpeg",
  "/images/login/login5.jpg",
] as const;

function getRandomLoginImage() {
  return LOGIN_IMAGES[Math.floor(Math.random() * LOGIN_IMAGES.length)];
}

export default function Page() {
  const [loginImage] = useState(getRandomLoginImage);
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "azure" | "email" | null
  >(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleAuth(provider: "google" | "azure") {
    setLoadingProvider(provider);
    setFormError(null);
    window.location.href = `/api/auth/${provider}`;
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setFormError("Enter your email address.");
      return;
    }

    setLoadingProvider("email");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoadingProvider(null);

    if (error) {
      setFormError(error.message);
      return;
    }

    setEmailSent(true);
  }

  const isLoading = loadingProvider !== null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <div className="flex w-full flex-col items-center justify-center px-6 lg:max-w-[480px]">
        <h1 className="absolute left-15 top-10 hidden text-3xl tracking-tight text-black">
          SLATE
        </h1>
        <div className="flex w-full max-w-[380px] flex-col items-center gap-12 rounded-lg bg-black/[0.02] p-4">
          <div className="flex w-full flex-col gap-2">
            <div className="text-2xl font-medium tracking-tight text-black">
              Design, create, and ship ideas faster — powered by multiple AI
              tools in one place.
            </div>
            <p className="hidden text-sm tracking-tight text-zinc-500">
              Sign in to your account
            </p>
          </div>

          {showEmailForm ? (
            <div className="flex w-full flex-col gap-2">
              {emailSent ? (
                <p className="text-center text-sm text-zinc-600">
                  Check your email for a sign-in link.
                </p>
              ) : (
                <form className="flex w-full flex-col gap-2" onSubmit={handleMagicLink}>
                  <input
                    autoComplete="email"
                    className="h-[40px] w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-black outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                    disabled={isLoading}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                  />
                  <button
                    className="inline-flex h-[40px] w-full items-center justify-center rounded-lg gray px-4 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isLoading}
                    type="submit"
                  >
                    {loadingProvider === "email" ? <Spinner /> : "Send magic link"}
                  </button>
                  {formError ? (
                    <p className="text-center text-xs text-red-600">{formError}</p>
                  ) : null}
                </form>
              )}
              <button
                className="text-sm font-semibold text-zinc-500 transition hover:text-black"
                type="button"
                onClick={() => {
                  setShowEmailForm(false);
                  setEmailSent(false);
                  setFormError(null);
                }}
              >
                Back
              </button>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-2">
              <button
                type="button"
                disabled={isLoading}
                className="inline-flex h-[40px] w-full items-center justify-center gap-3 rounded-lg gray px-4 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleAuth("google")}
              >
                {loadingProvider === "google" ? (
                  <Spinner />
                ) : (
                  <>
                    <GoogleIcon />
                    Continue with Google
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                className="inline-flex h-[40px] w-full items-center justify-center gap-3 rounded-lg gray px-4 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleAuth("azure")}
              >
                {loadingProvider === "azure" ? (
                  <Spinner />
                ) : (
                  <>
                    <MicrosoftIcon />
                    Continue with Microsoft
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                className="inline-flex h-[40px] w-full items-center justify-center rounded-lg gray px-4 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  setFormError(null);
                  setShowEmailForm(true);
                }}
              >
                Sign in with email
              </button>
            </div>
          )}

          <p className="max-w-[320px] text-center text-xs font-semibold leading-5 tracking-tight text-zinc-500">
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

      <div className="relative hidden w-full md:flex">
        <img
          src={loginImage}
          alt="Login background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
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
  );
}

function MicrosoftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 23 23"
      className="shrink-0"
      aria-hidden
    >
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
  );
}

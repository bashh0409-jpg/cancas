"use client";

import { createClient } from "@/lib/supabase/client";
import { AtSign } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const LOGIN_IMAGES = [
  "/images/login/auth-1.webp",
  "/images/login/auth-2.webp",
  "/images/login/auth-3.webp",
  "/images/login/auth-4.webp",
  "/images/login/auth-5.webp",
  "/images/login/auth-6.webp",
] as const;

type Provider = "google" | "azure" | "figma" | "email" | null;
const IMAGE_ROTATION_INTERVAL_MS = 20_000;

function getInitialFormError() {
  if (typeof window === "undefined") return null;

  const authError = new URLSearchParams(window.location.search).get("error");

  if (!authError) return null;

  const normalizedError = authError.toLowerCase();

  if (authError === "missing_code") {
    return "Sign-in was interrupted. Please try again.";
  }

  if (
    normalizedError.includes("code challenge") ||
    normalizedError.includes("code verifier") ||
    normalizedError.includes("pkce")
  ) {
    return "Your previous sign-in was interrupted. We cleared the stale session state and you can try again.";
  }

  return authError;
}

export default function Page() {
  const [loginImageIndex, setLoginImageIndex] = useState(0);
  const [loadingProvider, setLoadingProvider] = useState<Provider>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    getInitialFormError,
  );
  const loginImage = LOGIN_IMAGES[loginImageIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLoginImageIndex((currentIndex) =>
        currentIndex === LOGIN_IMAGES.length - 1 ? 0 : currentIndex + 1,
      );
    }, IMAGE_ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  function handleAuth(provider: "google" | "azure" | "figma") {
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
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/work`,
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
    <div className="flex h-screen w-full overflow-hidden bg-black text-white">
      {/* LEFT */}
      <div className="flex w-full flex-col  items-center h-full justify-between p-6 lg:max-w-[480px]">
        <span className=" gap-1">
          {" "}
          <Image
            src="/images/Reflow.svg"
            alt="Logo"
            width={64}
            height={64}
            className="object-contain shrink-0"
          />
          <span className="mono text-white/60 hidden  tracking-tight text-xs ml-1">
            BETA
          </span>
        </span>
        <div className="flex w-full max-w-[300px] flex-col items-center gap-6 rounded-lg ">
          <div className="flex w-full flex-col  gap-2">
            <div className="flex justify-center text-center mb-4 gap-2 mt-6 items-center">
              {" "}
              <span className="lime hidden text-center absolute z-50 p-1 rounded right-2 bottom-2 lime mono text-black uppercase text-xs">
                Operational
              </span>
              <span className="text-white hidden text-xs tracking-wider  mono uppercase text-center">
                ENTER THE COLLECTION
              </span>
              <span className="text-white text-xs tracking-tight mono uppercase text-center">
                THIS IS A BETA VERSION OF THE APP. YOU MAY ENCOUNTER BUGS OR
                UNEXPECTED ERRORS.
              </span>
            </div>

            <div className="text-4xl grotesk mb-4 capitaliz leading-none text-center tracking-tight">
              Sign in to continue using reflow
            </div>
          </div>

          {showEmailForm ? (
            <div className="flex w-full flex-col gap-2">
              {emailSent ? (
                <p className="text-center text-sm text-zinc-600">
                  Check your email for a sign-in link.
                </p>
              ) : (
                <form
                  className="flex w-full items-center justify-center flex-col gap-2"
                  onSubmit={handleMagicLink}
                >
                  <input
                    autoComplete="email"
                    className="h-8 max-w-70 tracking-tight w-full mono rounded border-2 border-black/10 bg-white px-3 sm:text-[16px] md:text-sm text-black outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                    disabled={isLoading}
                    placeholder="you@mail.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                  />

                  <button
                    className="inline-flex w-fit h-8 mono uppercase  items-center justify-center rounded lime px-4 font-medium text-xs text-black hover:bg-zinc-200 cursor-pointer disabled:opacity-60"
                    disabled={isLoading}
                    type="submit"
                  >
                    {loadingProvider === "email" ? (
                      <Spinner />
                    ) : (
                      "Send magic link"
                    )}
                  </button>

                  {formError && (
                    <p className="text-center mono text-xs text-red-600">
                      {formError}
                    </p>
                  )}
                </form>
              )}

              <button
                className="text-xs  mono cursor-pointer uppercase text-zinc-500 hover:text-white/80 transition-colors"
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
              {formError && (
                <p className="w-full text-center mono text-xs text-red-600">
                  {formError}
                </p>
              )}
              <button
                type="button"
                disabled={isLoading}
                className="inline-flex h-8 w-full items-center justify-center cursor-pointer  gap-3 rounded lime   px-4 text-xs mono uppercase tracking-tight text-black/80 transition-all hover:bg-white/80 disabled:opacity-60"
                onClick={() => handleAuth("google")}
              >
                {loadingProvider === "google" ? <Spinner /> : <GoogleIcon />}
                Continue with Google
              </button>

              <button
                type="button"
                disabled={isLoading}
                className="hidden h-8 w-full items-center justify-center cursor-pointer  gap-3 rounded lime px-4 text-xs mono uppercase tracking-tight text-black transition-all hover:bg-white/70 disabled:opacity-60"
                onClick={() => handleAuth("azure")}
              >
                {loadingProvider === "azure" ? <Spinner /> : <MicrosoftIcon />}
                Continue with Microsoft
              </button>
              <button
                type="button"
                disabled={isLoading}
                className="inline-flex h-8 w-full items-center justify-center cursor-pointer  gap-3 rounded lime px-4 text-xs mono uppercase tracking-tight text-black transition-all hover:bg-white/70 disabled:opacity-60"
                onClick={() => handleAuth("figma")}
              >
                {loadingProvider === "figma" ? <Spinner /> : <FigmaIcon />}
                Continue with Figma
              </button>

              <button
                type="button"
                disabled={isLoading}
                className="flex h-8 hidden gap-4 w-full items-center justify mono uppercase rounded cursor-pointer bg-white   px-4 text-xs tracking-tight text-black/80 transition-all hover:bg-white/80 disabled:opacity-60"
                onClick={() => {
                  setFormError(null);
                  setShowEmailForm(true);
                }}
              >
                <AtSign className="w-4 h-4 text-black/60 " strokeWidth={1.5} />
                Sign in with email
              </button>
            </div>
          )}
        </div>{" "}
        {/* RESTORED FOOTER TEXT */}
        <p className="max-w-[320px] mono uppercase tracking-tight text-center text-[10px] leading-snug text-white/80">
          By continuing, you agree to the{" "}
          <a
            href="/terms-of-service"
            className="underline mr-1 underline-offset-2 hover:text-white"
          >
            Terms of service
          </a>
          and acknowledge the{" "}
          <a
            href="/privacy-policy"
            className="underline underline-offset-2 hover:text-white"
          >
            Privacy Policy
          </a>
        </p>
      </div>

      {/* RIGHT */}
      <div className="relative hidden w-full md:flex">
        <Image
          src={loginImage}
          alt="Login background"
          fill
          priority
          fetchPriority="high"
          sizes="50vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}

/* unchanged helpers */

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    <svg width="20" height="20" viewBox="0 0 23 23">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function FigmaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 38 57" fill="none">
      <path d="M19 28.5C19 25.9804 20.0009 23.5641 21.7825 21.7825C23.5641 20.0009 25.9804 19 28.5 19C31.0196 19 33.4359 20.0009 35.2175 21.7825C36.9991 23.5641 38 25.9804 38 28.5C38 31.0196 36.9991 33.4359 35.2175 35.2175C33.4359 36.9991 31.0196 38 28.5 38C25.9804 38 23.5641 36.9991 21.7825 35.2175C20.0009 33.4359 19 31.0196 19 28.5Z" fill="#1ABCFE"/>
      <path d="M0 47.5C0 44.9804 1.00089 42.5641 2.78249 40.7825C4.56408 39.0009 6.98044 38 9.5 38H19V47.5C19 50.0196 17.9991 52.4359 16.2175 54.2175C14.4359 55.9991 12.0196 57 9.5 57C6.98044 57 4.56408 55.9991 2.78249 54.2175C1.00089 52.4359 0 50.0196 0 47.5Z" fill="#0ACF83"/>
      <path d="M19 0V19H28.5C31.0196 19 33.4359 17.9991 35.2175 16.2175C36.9991 14.4359 38 12.0196 38 9.5C38 6.98044 36.9991 4.56408 35.2175 2.78249C33.4359 1.00089 31.0196 0 28.5 0H19Z" fill="#FF7262"/>
      <path d="M0 9.5C0 12.0196 1.00089 14.4359 2.78249 16.2175C4.56408 17.9991 6.98044 19 9.5 19H19V0H9.5C6.98044 0 4.56408 1.00089 2.78249 2.78249C1.00089 4.56408 0 6.98044 0 9.5Z" fill="#F24E1E"/>
      <path d="M0 28.5C0 31.0196 1.00089 33.4359 2.78249 35.2175C4.56408 36.9991 6.98044 38 9.5 38H19V19H9.5C6.98044 19 4.56408 20.0009 2.78249 21.7825C1.00089 23.5641 0 25.9804 0 28.5Z" fill="#A259FF"/>
    </svg>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
  );
}

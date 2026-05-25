import React from "react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center sm:px-8">
      <h1 className="pixel max-w-4xl text-2xl font-semibold tracking-normal text-white sm:text-7xl lg:text-8xl">
        Everything you need for art-directed design.
      </h1>
      <p className="mt-6 max-w-2xl text-sm text-white/70 sm:text-lg">
        Design, create, and ship ideas faster — powered by multiple AI tools in
        one place.
      </p>
      <Link
        href="/signup"
        className="mt-8 rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-tight text-black transition hover:bg-white/85"
      >
        Start for free
      </Link>
    </section>
  );
};

export default Hero;

import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-4">
      <h1 className="pixel mix-blend-difference text-2xl font-semibold tracking-tight text-white">
        SLATE
      </h1>
      <div className="flex items-center gap-2">
        <Link href="/signin" className="px-2 py-1 bg-white/20 rounded-full">
          Sign in
        </Link>

        <Link href="/signup" className="px-2 py-1 bg-white/20 rounded-full">
          Start for free
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <h1 className="text-white text-2xl tracking-tight pixel font-semibold">SLATE</h1>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/signin" className="px-2 py-1 bg-white/20 rounded-full">
          Sign in
        </Link>
        <Link href="/signup" className="px-2 py-1 bg-white/20 rounded-full">
          Start for free
        </Link>
      </div>
    </div>
  );
}

export default Navbar;

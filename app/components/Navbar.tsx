import Link from "next/link";
import React from "react";
import {ArrowUpRight} from "lucide-react"

const Navbar = () => {
  return (
    <nav className="absolute top-0 fixed left-0 z-50 flex w-full items-center justify-between px-6 py-4">
      <h1 className="pixel mix-blend-difference text-2xl font-semibold tracking-tight text-white">
        SLATE
      </h1>
      <div className="hidden">
        <button>Interprise</button>
        <button>About</button>
        <button>About</button>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/signin" className="px-2 hidden  gap-2 text-xs flex items-center py-1 bg-white text-black rounded">
          Join Waitlist{" "}
          <span>
            {" "}
            <ArrowUpRight className="h-5 bg-black text-white w-5 rounded" />
          </span>
        </Link>
        <Link href="/signin" className="px-2  gap-2 text-xs flex items-center py-1 bg-white text-black rounded">
          Start a project{" "}
          <span>
            {" "}
            <ArrowUpRight className="h-6 bg-black text-white w-6 rounded" />
          </span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

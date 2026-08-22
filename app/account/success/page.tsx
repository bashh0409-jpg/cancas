import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function BillingSuccess() {


  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-xl uppercase tracking-tight mono mb-2">
          Account Successfully Deleted!
        </h1>

        <p className="mt-2 font-mono tracking-tight uppercase text-black/60">
          Your account was successfully deleted. We are sorry to see you go. If you change your mind, you can always create a new account.
        </p>

        <div className=" flex justify-center items-center mt-4 text-sm mono gap-2 items-center ">
          <Link
            href="/work"
            className="flex items-center  w-fit p-1.5 text-sm px-3 hover:bg-black/10 uppercase text-black bg-black/6 rounded-full  transition-colors"
          >
            Start Over
            <ArrowUpRight className="w-4 hidden h-4 ml-1" />
          </Link>
         
        </div>
      </div>
    </div>
  );
}

import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import { Pricing } from "./components/Pricing";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import Animated from "./components/animated";

const page = () => {
  return (
    <div className="text-white">
      <div><Navbar />
        <div className="relative h-screen bg-white  overflow-hidden">
          
        </div>
        <div >
          <Animated />
        </div>
        <section className="mx-auto hidden flex w-full max-w-[1300px] flex-col items-center gap-5 px-4 lg:flex-row lg:justify-center lg:gap-12 lg:px-0  ">
          <div className="flex w-full flex-1 justify-end">
            <h1 className="flex-1 text-center text-[36px]  leading-15 tracking-tight max-lg:mx-auto lg:max-w-[372px] lg:text-right lg:text-[66px] lg:tracking-[-2.64px]">
              Know what you&apos;re looking at.
            </h1>
          </div>

          <div className="relative h-[420px] w-full max-w-[360px] overflow-hidden rounded-xl lg:aspect-[420/640] lg:h-auto lg:w-full lg:max-w-[360px] xl:max-w-[420px]">
            <div className="bg-white h-full w-full rounded" />
          </div>

          <div className="w-full hidden flex-1">
            <p className="max-w-[330px] hidden flex-1 text-center text-[26px]  tracking-tight max-lg:mx-auto lg:max-w-[300px] lg:text-left"></p>
          </div>
        </section>
        <div className="mt-10 hidden">
          <Animated />
        </div>
        <Pricing />
        <Faq />
        <div className=" text-white  h-screen w-full flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <a
              href="/home"
              className="text-xl tracking-tight bg-white text-black rounded p-2 cursor-pointer capitalize hover:bg-white/80"
            >
              Sign up now
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default page;

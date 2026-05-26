import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Pricing from "./components/Pricing";


const page = () => {
  return (
    <div className="text-white">
      <div className="relative h-screen overflow-hidden">
        <Navbar />
        <Hero />
      </div>
      <div className="">
        <Pricing />
      </div>
    </div>
  );
};

export default page;

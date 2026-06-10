import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import { Pricing } from "./components/Pricing";
import Faq from "./components/Faq";
import Footer from "./components/Footer";

const page = () => {
  return (
    <div className="text-white">
      <div>
        <div className="relative h-screen mb-60 overflow-hidden">
          <Navbar />
          <Hero />
        </div>
        <Pricing />
        <Faq />
        
        <Footer />
      </div>
    </div>
  );
};

export default page;

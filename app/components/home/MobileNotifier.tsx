import React from "react";

const MobileNotifier = () => {
  return (
    <div className="w-full h-screen md:hidden grid place-items-center z-[1000] bg-black text-white text-center px-4">
      <p className="text-xs font-normal mono md:text-base">
        You caught us! This page is not available on mobile devices yet. Please visit our website on a desktop to access all features. We apologize for the inconvenience and appreciate your understanding as we work to bring a full experience to all platforms soon.
      </p>
    </div>
  );
};

export default MobileNotifier;

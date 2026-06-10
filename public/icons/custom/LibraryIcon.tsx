import * as React from "react";

export function LibraryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* shelf */}
      <path d="M8 38H40" />

      {/* books */}
      <path d="M12 12C12 10.8954 12.8954 10 14 10H18C19.1046 10 20 10.8954 20 12V38H14C12.8954 38 12 37.1046 12 36V12Z" />

      <path d="M22 9C22 7.89543 22.8954 7 24 7H28C29.1046 7 30 7.89543 30 9V38H24C22.8954 38 22 37.1046 22 36V9Z" />

      {/* tilted book adds personality / visual balance */}
      <path d="M33 13.5C32.8638 12.4038 33.6417 11.4049 34.7379 11.2687L38.7068 10.7756C39.803 10.6394 40.8019 11.4173 40.9381 12.5135L43.9648 36.8615C44.101 37.9577 43.3231 38.9566 42.2269 39.0928L38.258 39.5859C37.1618 39.7221 36.1629 38.9442 36.0267 37.848L33 13.5Z" />
    </svg>
  );
}

// CanvasPlaceholderIcon.tsx
// Clean, lightweight SVG adapted for use as a neutral canvas placeholder

export default function CanvasPlaceholderIcon({
  size = 96,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* softened stroke paths for a cleaner placeholder feel */}
      <g opacity={0.9}>
        <path
          d="M7.84017 12.7152C0.968439 17.6931 -0.100043 13.6619 6.00491 8.83594"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.0596 10.2805C19.5136 8.10285 16.1117 12.3704 12.0334 14.9809C7.95509 17.5915 3.20039 18.5454 7.8401 12.7154"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.45605 6.73112C17.7011 -0.932842 24.5996 3.70687 11.0594 10.2807"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.45631 6.73073C11.9444 -6.18441 0.129103 11.7583 6.00533 8.8363"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.4428 7.68537C11.3991 7.61918 11.3448 7.56231 11.282 7.51436C11.2102 7.45962 11.13 7.41846 11.0456 7.38834C10.9476 7.35354 10.844 7.33402 10.7405 7.32596C10.6213 7.31662 10.5046 7.32171 10.3866 7.33741C10.0034 7.38834 9.62153 7.55213 9.3037 7.7626C8.98544 7.97307 8.68544 8.26035 8.48897 8.59346C8.42829 8.69614 8.37822 8.80138 8.34045 8.9151C8.30778 9.01355 8.28529 9.11624 8.27892 9.2202C8.27341 9.30974 8.28019 9.3997 8.30226 9.48711C8.32178 9.56392 8.35318 9.63605 8.39689 9.70183C8.44059 9.76802 8.49491 9.82488 8.55771 9.87283C8.62942 9.92757 8.70963 9.96873 8.79407 9.99886C8.89209 10.0337 8.99563 10.0532 9.09917 10.0612C9.21841 10.0706 9.3351 10.0655 9.45306 10.0498C9.83624 9.99886 10.2181 9.83507 10.536 9.6246C10.8542 9.41412 11.1542 9.12685 11.3507 8.79374C11.4114 8.69105 11.4615 8.58582 11.4992 8.47209C11.5319 8.37365 11.5544 8.27096 11.5608 8.167C11.5663 8.07746 11.5595 7.9875 11.5374 7.90051C11.5179 7.82371 11.4865 7.75157 11.4428 7.6858V7.68537Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

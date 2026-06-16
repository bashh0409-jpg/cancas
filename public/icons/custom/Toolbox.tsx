export function Toolbox(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      {...props}
    >
      <path d="M11 10V7.5A2.5 2.5 0 0 1 13.5 5h5A2.5 2.5 0 0 1 21 7.5V10" />
      <path d="M4 10h24v16H4z" />
      <path d="M4 16h8" />
      <path d="M20 16h8" />
      <path d="M12 15h8v3h-8z" />
    </svg>
  );
}

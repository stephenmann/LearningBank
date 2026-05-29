import type { SVGProps } from "react";

export function DepositSymbolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M19 5v14" />
      <path d="M19 12H5" />
      <path d="m13.5 6.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}

export function WithdrawSymbolIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M19 5v14" />
      <path d="M19 12H5" />
      <path d="m10.5 6.5-5.5 5.5 5.5 5.5" />
    </svg>
  );
}

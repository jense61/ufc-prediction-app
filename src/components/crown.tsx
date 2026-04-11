import type { SVGProps } from "react";

export function Crown({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M3 18L5.5 9L9 13L12 7L15 13L18.5 9L21 18H3Z" />
      <rect x="3" y="18" width="18" height="2" />
    </svg>
  );
}
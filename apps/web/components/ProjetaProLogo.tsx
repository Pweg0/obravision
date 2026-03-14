import { cn } from "@/lib/utils"

interface ProjetaProLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
}

export function ProjetaProLogo({ size = "md", className }: ProjetaProLogoProps) {
  return (
    <svg
      className={cn(sizes[size], className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#2563EB" />
      <path
        d="M8 24V10L16 6L24 10V24L16 20L8 24Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M16 6V20" stroke="white" strokeWidth="2" />
    </svg>
  )
}

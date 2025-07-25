import * as React from "react"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ai" | "auto"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses: Record<BadgeVariant, string> = {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline: "text-foreground border border-input",
      ai: "bg-accent text-accent-foreground hover:bg-accent/80",
      auto: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20",
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus: outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className || ''}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge };
export type { BadgeProps };
export default Badge; 
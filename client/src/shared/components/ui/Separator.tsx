import * as React from "react"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

/**
 * Separator component for visual division of content
 * @param className - Additional CSS classes
 * @param orientation - Whether the separator is horizontal or vertical
 * @param props - Additional div props
 */
const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`shrink-0 bg-border ${
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"
        } ${className || ''}`}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator } 

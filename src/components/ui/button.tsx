import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn-base shadow-unified-sm",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90 shadow-unified-md hover:shadow-unified-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-unified-md hover:shadow-unified-lg",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted hover:text-foreground hover:shadow-unified-md",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80 hover:shadow-unified-md",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline shadow-none",
        primary: "bg-foreground text-background hover:bg-foreground/90 shadow-unified-md hover:shadow-unified-lg",
        edit: "border border-border bg-background text-foreground hover:bg-muted hover:shadow-unified-md",
        action: "bg-foreground text-background hover:bg-foreground/90 shadow-unified-md hover:shadow-unified-lg",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-unified-md hover:shadow-unified-lg"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-unified-sm px-3 text-unified-xs",
        lg: "h-11 rounded-unified-lg px-8 text-unified-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }


import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn-base shadow-unified-sm",
  {
    variants: {
      variant: {
        // Bouton principal - action primaire
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-unified-md hover:shadow-unified-lg",
        
        // Bouton secondaire - action secondaire importante
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border hover:shadow-unified-md",
        
        // Bouton avec contour - action alternative
        outline: "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-unified-md",
        
        // Bouton fantôme - action discrète
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        
        // Bouton destructeur - action dangereuse
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-unified-md hover:shadow-unified-lg",
        
        // Bouton lien - navigation ou action légère
        link: "text-primary underline-offset-4 hover:underline shadow-none p-0 h-auto",
        
        // États spéciaux pour certains contextes
        success: "bg-green-600 text-white hover:bg-green-700 shadow-unified-md hover:shadow-unified-lg",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 shadow-unified-md hover:shadow-unified-lg",
        info: "bg-blue-600 text-white hover:bg-blue-700 shadow-unified-md hover:shadow-unified-lg"
      },
      size: {
        sm: "h-8 px-3 text-unified-xs rounded-unified-sm",
        default: "h-10 px-4 py-2 text-unified-sm rounded-unified",
        lg: "h-12 px-6 py-3 text-unified-base rounded-unified-lg",
        icon: "h-9 w-9 rounded-unified",
        "icon-sm": "h-7 w-7 rounded-unified-sm",
        "icon-lg": "h-11 w-11 rounded-unified-lg"
      },
      state: {
        default: "",
        active: "ring-2 ring-ring ring-offset-2",
        loading: "opacity-60 cursor-not-allowed pointer-events-none"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      state: "default"
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  isActive?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, state, asChild = false, isLoading, isActive, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Déterminer l'état du bouton
    const buttonState = isLoading ? "loading" : isActive ? "active" : state || "default"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, state: buttonState, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

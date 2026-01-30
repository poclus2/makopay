import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          "bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full shadow-[0_4px_20px_hsl(165_86%_56%/0.4)] hover:shadow-[0_6px_30px_hsl(165_86%_56%/0.5)] hover:-translate-y-0.5",
        destructive: 
          "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground rounded-full shadow-[0_4px_20px_hsl(0_74%_71%/0.3)] hover:shadow-[0_6px_25px_hsl(0_74%_71%/0.4)] hover:-translate-y-0.5",
        outline: 
          "border-2 border-primary/30 bg-transparent text-foreground rounded-full hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(165_86%_56%/0.2)]",
        secondary: 
          "bg-card/80 backdrop-blur-sm border border-border/50 text-foreground rounded-full hover:bg-card hover:border-primary/30 hover:shadow-[0_4px_15px_hsl(165_86%_56%/0.15)]",
        ghost: 
          "text-foreground rounded-full hover:bg-primary/10 hover:text-primary",
        link: 
          "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-card/60 backdrop-blur-xl border border-border/30 text-foreground rounded-full hover:bg-card/80 hover:border-primary/40 hover:shadow-[0_8px_30px_hsl(165_86%_56%/0.2)] hover:-translate-y-0.5",
        premium:
          "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-primary-foreground rounded-full shadow-[0_4px_25px_hsl(165_86%_56%/0.5)] hover:bg-[position:100%_0] hover:shadow-[0_8px_35px_hsl(165_86%_56%/0.6)] hover:-translate-y-1 transition-all duration-500",
        glow:
          "bg-primary text-primary-foreground rounded-full relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 shadow-[0_0_20px_hsl(165_86%_56%/0.4)] hover:shadow-[0_0_35px_hsl(165_86%_56%/0.6)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

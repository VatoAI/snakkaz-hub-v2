
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

const snakkazButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-snakkaz text-white hover:shadow-snakkaz-hover",
        outline: "border border-snakkaz-blue/30 hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
        ghost: "bg-transparent hover:bg-gradient-snakkaz hover:text-white hover:shadow-snakkaz-hover",
        link: "text-snakkaz-blue underline-offset-4 hover:underline",
        destructive: "bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "h-10 w-10 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SnakkazButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof snakkazButtonVariants> {
  asChild?: boolean;
}

const SnakkazButton = React.forwardRef<HTMLButtonElement, SnakkazButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(snakkazButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
SnakkazButton.displayName = "SnakkazButton";

export { SnakkazButton, snakkazButtonVariants };

import * as React from "react"
import {Slot} from "@radix-ui/react-slot"
import {cva} from "class-variance-authority";

import {cn} from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden shadow-md",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
                destructive:
                    "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
                bluelavender:
                    "border-transparent bg-[#5A74F8] text-primary-foreground [a&]:hover:bg-primary/90",
                brightgreen:
                    "border-transparent bg-[#23C491] text-primary-foreground [a&]:hover:bg-primary/90",
                aqua:
                    "border-transparent bg-[#4DD0E1] text-white [a&]:hover:bg-[#26C6DA]",
                orange:
                    "border-transparent bg-[#FFB74D] text-white [a&]:hover:bg-[#FFA726]",
                pink:
                    "border-transparent bg-[#F48FB1] text-white [a&]:hover:bg-[#F06292]",
                lime:
                    "border-transparent bg-[#DCE775] text-black [a&]:hover:bg-[#D4E157]",
                violet:
                    "border-transparent bg-[#B39DDB] text-white [a&]:hover:bg-[#9575CD]",
                sand:
                    "border-transparent bg-[#F5DEB3] text-black [a&]:hover:bg-[#EED8A1]",
                coral:
                    "border-transparent bg-[#FF6F61] text-white [a&]:hover:bg-[#FF5647]",
                teal:
                    "border-transparent bg-[#1ABC9C] text-white [a&]:hover:bg-[#17A589]",
                mint:
                    "border-transparent bg-[#A3E4D7] text-black [a&]:hover:bg-[#76D7C4]",
                mustard:
                    "border-transparent bg-[#FFD966] text-black [a&]:hover:bg-[#FFCC33]",
                peach:
                    "border-transparent bg-[#FFBFAE] text-black [a&]:hover:bg-[#FFA07A]",
                sky:
                    "border-transparent bg-[#87CEEB] text-black [a&]:hover:bg-[#00BFFF]",
                plum:
                    "border-transparent bg-[#8E4585] text-white [a&]:hover:bg-[#7B3F7B]",
                olive:
                    "border-transparent bg-[#808000] text-white [a&]:hover:bg-[#6B6B00]",
                red:
                    "border-transparent bg-[#DC143C] text-white [a&]:hover:bg-[#B01030]"

            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({
                   className,
                   variant,
                   asChild = false,
                   ...props
               }) {
    const Comp = asChild ? Slot : "span"

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({variant}), className)}
            {...props} />
    );
}

export {Badge, badgeVariants}

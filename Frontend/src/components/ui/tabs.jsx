import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props} />
  );
}

function TabsList({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-start gap-2",
        className
      )}
      {...props} />
  );
}

function TabsTrigger({
  className,
  children,
  ...props
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        `group relative inline-flex items-center gap-2 px-5 h-full
         text-[18px] font-medium whitespace-nowrap rounded-xl 
         transition-all duration-200 
         hover:text-[#068F64]
         data-[state=active]:text-green-700`,
        className
      )}
      {...props}>
      <span className="relative flex h-full items-center gap-2">
        {children}
        <span className="absolute bottom-0 left-0 h-[5px] w-full rounded-t-full bg-[#068F64] opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
      </span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
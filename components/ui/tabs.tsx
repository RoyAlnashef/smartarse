'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const TabsListVariantContext = React.createContext<
  'default' | 'line' | 'vertical'
>('default')

const tabsListVariants = cva('items-center text-muted-foreground', {
  variants: {
    variant: {
      default: 'inline-flex h-10 justify-center rounded-md bg-muted p-1',
      line:
        'inline-flex h-10 w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0',
      vertical:
        'flex h-fit w-full shrink-0 flex-col items-stretch justify-start gap-0.5 self-start rounded-none bg-transparent p-0 sm:w-48',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      listVariant: {
        default:
          'rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        line: '-mb-px rounded-none border-b-2 border-transparent bg-transparent px-0 py-2 text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none',
        vertical:
          'w-full justify-start rounded-lg border border-transparent bg-transparent px-3 py-2 text-left transition-colors hover:border-cyan-200/80 hover:bg-cyan-50/60 data-[state=active]:border-cyan-200 data-[state=active]:bg-cyan-50/90 data-[state=active]:text-foreground data-[state=active]:shadow-none',
      },
    },
    defaultVariants: {
      listVariant: 'default',
    },
  },
)

const Tabs = TabsPrimitive.Root

export interface TabsListProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsListVariantContext.Provider value={variant ?? 'default'}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant, className }))}
      {...props}
    />
  </TabsListVariantContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const listVariant = React.useContext(TabsListVariantContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ listVariant, className }))}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

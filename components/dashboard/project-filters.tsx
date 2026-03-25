"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const statuses = ["all", "live", "archived"] as const

function ClientCombobox({
  clients,
  value,
  onValueChange,
}: {
  clients: string[]
  value: string | null
  onValueChange: (v: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)

  /** cmdk list value (must match each CommandItem `value`); drives keyboard highlight + data-selected */
  const selectedValue = value === null ? "all clients" : value
  const [listValue, setListValue] = React.useState(selectedValue)

  React.useEffect(() => {
    if (open) {
      setListValue(selectedValue)
    }
  }, [open, selectedValue])

  const label = value ?? "All clients"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="project-client-combobox"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between rounded-lg border-border bg-card px-3 font-normal hover:bg-card sm:w-[min(100%,14rem)]"
        >
          <span className="truncate text-left text-sm">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,20rem)] p-0 sm:w-[14rem]"
        align="start"
      >
        <Command value={listValue} onValueChange={setListValue}>
          <CommandInput placeholder="Search clients..." className="h-9" />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all clients"
                onSelect={() => {
                  onValueChange(null)
                  setListValue("all clients")
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                />
                All clients
              </CommandItem>
              {clients.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onValueChange(name)
                    setListValue(name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === name ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  clients,
  clientFilter,
  onClientFilterChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  clients: string[]
  clientFilter: string | null
  onClientFilterChange: (v: string | null) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        {/* Search */}
        <div className="relative max-w-sm flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-arse-cyan focus:outline-none focus:ring-2 focus:ring-arse-pink/30"
          />
        </div>

        {/* Client combobox */}
        <div className="shrink-0 sm:w-auto">
          <label className="sr-only" htmlFor="project-client-combobox">
            Filter by client
          </label>
          <ClientCombobox
            clients={clients}
            value={clientFilter}
            onValueChange={onClientFilterChange}
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 sm:shrink-0">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              status === s
                ? "bg-dark-950 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

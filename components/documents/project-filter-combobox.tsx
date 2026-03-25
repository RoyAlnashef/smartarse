"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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

export function ProjectFilterCombobox({
  projects,
  value,
  onValueChange,
}: {
  projects: { id: string; name: string }[]
  value: string
  onValueChange: (v: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  const selectedProject = projects.find((p) => p.id === value)
  const selectedValue =
    value === "all" ? "all projects" : selectedProject?.name ?? "all projects"

  /** cmdk list value (must match each CommandItem `value`); drives keyboard highlight + data-selected */
  const [listValue, setListValue] = React.useState(selectedValue)

  React.useEffect(() => {
    if (open) {
      setListValue(selectedValue)
    }
  }, [open, selectedValue])

  const label =
    value === "all" ? "All Projects" : selectedProject?.name ?? "All Projects"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="documents-project-combobox"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between rounded-lg border-border bg-card px-3 font-normal hover:bg-card focus-visible:border-arse-cyan focus-visible:ring-2 focus-visible:ring-arse-pink/30 focus-visible:ring-offset-0 sm:w-[min(100%,14rem)]"
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
          <CommandInput placeholder="Search projects..." className="h-9" />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all projects"
                onSelect={() => {
                  onValueChange("all")
                  setListValue("all projects")
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0",
                  )}
                />
                All Projects
              </CommandItem>
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onValueChange(p.id)
                    setListValue(p.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

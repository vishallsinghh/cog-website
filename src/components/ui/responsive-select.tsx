"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

const EMPTY_VALUE = "__empty__"

type ResponsiveSelectOption = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

type ResponsiveSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: ResponsiveSelectOption[]
  label: string
  placeholder?: string
  id?: string
  name?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
  onBlur?: () => void
  ref?: React.Ref<HTMLButtonElement>
  "aria-label"?: string
  "aria-invalid"?: boolean
}

const triggerClassName =
  "flex w-fit min-w-0 items-center justify-between gap-1.5 rounded-[10px] border border-input bg-white pr-2.5 pl-3 text-left text-[15px] whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-11 data-[size=sm]:h-8 data-[size=sm]:text-sm dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

function toInner(value: string) {
  return value === "" ? EMPTY_VALUE : value
}

function fromInner(value: string) {
  return value === EMPTY_VALUE ? "" : value
}

function ResponsiveSelect({
  value,
  onValueChange,
  options,
  label,
  placeholder,
  id,
  name,
  disabled,
  className,
  size = "default",
  onBlur,
  ref,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: ResponsiveSelectProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const listboxId = React.useId()
  const selected = options.find((option) => option.value === value)
  const hasValue = selected !== undefined

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) onBlur?.()
        }}
      >
        <button
          ref={ref}
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          data-slot="select-trigger"
          data-size={size}
          data-placeholder={hasValue ? undefined : ""}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          className={cn(triggerClassName, className)}
          onClick={() => setOpen(true)}
        >
          <span className="truncate">
            {hasValue ? selected.label : placeholder}
          </span>
          <ChevronDownIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-heading text-lg text-green">
              {label}
            </DrawerTitle>
          </DrawerHeader>
          <div
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="flex flex-col gap-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left text-[15px] transition-colors outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-selected:bg-accent aria-selected:font-medium aria-selected:text-accent-foreground"
                  onClick={() => {
                    if (!isSelected) onValueChange(option.value)
                    setOpen(false)
                    onBlur?.()
                  }}
                >
                  <span className="min-w-0 flex-1">{option.label}</span>
                  {isSelected && (
                    <CheckIcon
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Select
      value={hasValue ? toInner(value) : ""}
      onValueChange={(next) => onValueChange(fromInner(next))}
      onOpenChange={(next) => {
        if (!next) onBlur?.()
      }}
      name={name}
      disabled={disabled}
    >
      <SelectTrigger
        ref={ref}
        id={id}
        size={size}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={cn(triggerClassName, className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-80">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={toInner(option.value)}
            disabled={option.disabled}
            className="py-2 pl-2.5 text-[15px]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { ResponsiveSelect, type ResponsiveSelectOption }

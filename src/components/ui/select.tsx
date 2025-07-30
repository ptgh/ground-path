import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { gsap } from "gsap"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const iconRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const icon = iconRef.current
    if (!icon) return

    const handlePointerEnter = () => {
      gsap.to(icon, {
        scale: 1.1,
        duration: 0.2,
        ease: "power2.out"
      })
    }

    const handlePointerLeave = () => {
      gsap.to(icon, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      })
    }

    icon.addEventListener('pointerenter', handlePointerEnter)
    icon.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      icon.removeEventListener('pointerenter', handlePointerEnter)
      icon.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-200 hover:border-primary/50 hover:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <div ref={iconRef}>
          <ChevronDown className="h-4 w-4 opacity-70 transition-opacity hover:opacity-100" />
        </div>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const content = contentRef.current
    if (!content) return

    // GSAP animation for opening
    const tl = gsap.timeline({ paused: true })
    
    tl.fromTo(content, 
      { 
        opacity: 0, 
        scale: 0.95, 
        y: -10 
      },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.25,
        ease: "power2.out"
      }
    )

    // Animate items
    const items = content.querySelectorAll('[role="option"]')
    tl.fromTo(items,
      {
        opacity: 0,
        y: 10
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.15,
        stagger: 0.03,
        ease: "power2.out"
      },
      "-=0.1"
    )

    // Play animation when content appears
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          const state = content.getAttribute('data-state')
          if (state === 'open') {
            tl.restart()
          }
        }
      })
    })

    observer.observe(content, { attributes: true })

    return () => {
      observer.disconnect()
      tl.kill()
    }
  }, [])

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={(node) => {
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
          contentRef.current = node
        }}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg backdrop-blur-sm",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-2",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const itemRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const item = itemRef.current
    if (!item) return

    const handlePointerEnter = () => {
      gsap.to(item, {
        scale: 1.02,
        x: 4,
        duration: 0.2,
        ease: "power2.out"
      })
    }

    const handlePointerLeave = () => {
      gsap.to(item, {
        scale: 1,
        x: 0,
        duration: 0.2,
        ease: "power2.out"
      })
    }

    item.addEventListener('pointerenter', handlePointerEnter)
    item.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      item.removeEventListener('pointerenter', handlePointerEnter)
      item.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <SelectPrimitive.Item
      ref={(node) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
        itemRef.current = node
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-2.5 pl-10 pr-3 text-sm outline-none focus:bg-primary/10 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors",
        className
      )}
      {...props}
    >
      <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

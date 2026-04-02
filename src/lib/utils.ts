import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function scrollToSectionWithOffset(sectionId: string, offset = 96) {
  if (typeof window === 'undefined') return false

  const section = document.getElementById(sectionId)
  if (!section) return false

  const heading = section.querySelector('h1, h2') as HTMLElement | null
  const target = heading ?? section
  const top = Math.max(target.getBoundingClientRect().top + window.scrollY - offset, 0)

  window.scrollTo({ top, behavior: 'smooth' })
  return true
}

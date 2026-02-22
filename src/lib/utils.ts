import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Log only in development — suppressed in production to avoid leaking sensitive data. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args);
  }
}

/** Warn only in development. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debugWarn(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.warn(...args);
  }
}

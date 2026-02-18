import { Toaster as Sonner } from "sonner"
import { useEffect, useState } from "react"

export function Toaster(props) {
  const [theme, setTheme] = useState("system")

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const updateTheme = () => {
      setTheme(media.matches ? "dark" : "light")
    }

    updateTheme()
    media.addEventListener("change", updateTheme)
    return () => media.removeEventListener("change", updateTheme)
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-white text-zinc-900 border border-zinc-200 shadow-lg dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800",
          description: "text-zinc-500 dark:text-zinc-400",
          actionButton:
            "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
          cancelButton:
            "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
        },
      }}
      {...props}
    />
  )
}

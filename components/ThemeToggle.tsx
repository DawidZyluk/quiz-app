"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectLabel,
  SelectGroup,
} from "@/components/ui/select"

export function ThemeToggle() {
  const t = useTranslations("Theme")
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
        <div className="flex items-center gap-2 opacity-50">
            <Select disabled>
                <SelectTrigger className="w-auto min-w-[140px]">
                    <SelectValue placeholder={t("title")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="placeholder">...</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
  }

  // Determine current mode (light/dark) and color theme
  const isDark = resolvedTheme === "dark" || resolvedTheme === "yellow-dark" || resolvedTheme === "navy-dark"
  const isYellow = theme === "yellow-light" || theme === "yellow-dark"
  const isNavy = theme === "navy-light" || theme === "navy-dark"

  const currentMode = isDark ? "dark" : "light"
  let currentColor = "zinc"
  if (isYellow) currentColor = "yellow"
  if (isNavy) currentColor = "navy"

  const handleValueChange = (value: string) => {
    switch (value) {
      // Mode switching
      case "light":
        if (isYellow) setTheme("yellow-light")
        else if (isNavy) setTheme("navy-light")
        else setTheme("light")
        break
      case "dark":
        if (isYellow) setTheme("yellow-dark")
        else if (isNavy) setTheme("navy-dark")
        else setTheme("dark")
        break
      case "system":
        setTheme("system")
        break
      // Color switching
      case "zinc":
        setTheme(isDark ? "dark" : "light")
        break
      case "yellow":
        setTheme(isDark ? "yellow-dark" : "yellow-light")
        break
      case "navy":
        setTheme(isDark ? "navy-dark" : "navy-light")
        break
    }
  }

  return (
      <Select
        value={currentMode} 
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-auto min-w-[140px]">
           <div className="flex items-center gap-2">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="truncate">
                  {t(currentMode)} 
                  {currentColor !== "zinc" && ` (${t(currentColor)})`}
              </span>
           </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
              <SelectLabel>{t("title")}</SelectLabel>
              <SelectItem value="light">{t("light")}</SelectItem>
              <SelectItem value="dark">{t("dark")}</SelectItem>
              <SelectItem value="system">{t("system")}</SelectItem>
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
              <SelectLabel>{t("color")}</SelectLabel>
              <SelectItem value="zinc">
                  <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-zinc-500"></div>
                      {t("zinc")}
                  </div>
              </SelectItem>
              <SelectItem value="yellow">
                  <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#FFB700]"></div>
                      {t("yellow")}
                  </div>
              </SelectItem>
              <SelectItem value="navy">
                  <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#202D46]"></div>
                      {t("navy")}
                  </div>
              </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
  )
}

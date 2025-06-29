"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center space-x-1 min-w-[60px]">
      <span className="text-lg">{language === "es" ? "🇪🇸" : "🇺🇸"}</span>
      <span className="text-sm font-medium">{language.toUpperCase()}</span>
    </Button>
  )
}

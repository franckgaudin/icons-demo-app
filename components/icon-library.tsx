"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import * as LucideIcons from "lucide-react"
import { Download } from "lucide-react"

import { cn } from "@/lib/utils"

async function generateAliasesWithAI(iconName: string): Promise<string[]> {
  const response = await fetch("/api/tag", {
    method: "POST",
    body: JSON.stringify({
      name: iconName,
    }),
  })

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`)
  }

  const { object } = await response.json()
  return object.synonyms
}

interface IconWithAliases {
  name: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  aliases: string[]
}

async function getAliasesWithCache(iconName: string): Promise<string[]> {
  const cacheKey = `icon_aliases_${iconName}`
  const cachedAliases = localStorage.getItem(cacheKey)

  if (cachedAliases) {
    return JSON.parse(cachedAliases)
  } else {
    const aliases = await generateAliasesWithAI(iconName)
    localStorage.setItem(cacheKey, JSON.stringify(aliases))
    return aliases
  }
}

function shouldRefreshCache(): boolean {
  const lastRefresh = localStorage.getItem("last_cache_refresh")
  if (!lastRefresh) return true

  const now = new Date().getTime()
  const refreshInterval = 24 * 60 * 60 * 1000
  return now - parseInt(lastRefresh) > refreshInterval
}

function IconDetailView({ icon }: { icon: IconWithAliases | null }) {
  if (!icon) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const { name, Icon, aliases } = icon

  return (
    <Card className="h-full my-4 border-none shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <Icon className="w-8 h-8" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {aliases.map((alias, index) => (
              <span
                key={index}
                className="bg-tags text-tags-foreground px-2 py-1 rounded-full text-sm"
              >
                {alias}
              </span>
            ))}
          </div>
        </div>
        <Button className="w-full" variant="default">
          <Download className="mr-2 h-4 w-4" /> Download SVG
        </Button>

        <Separator />

        <div>
          <h3 className="font-semibold mb-1">React</h3>
          <p className="mb-6">Import the icon from lucide-react</p>
          <pre className="bg-neutral-900 text-white p-4 rounded-md text-sm overflow-x-auto">
            <code>{`import { ${name} } from 'lucide-react'`}</code>
          </pre>
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}

function IconSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-2 bg-slate-100">
      <Skeleton className="w-8 h-8 mb-2 bg-slate-200" />
      <Skeleton className="h-4 w-16 bg-slate-200" />
    </div>
  )
}

export default function IconLibrary() {
  const [searchTerm, setSearchTerm] = useState("")
  const [iconsWithAliases, setIconsWithAliases] = useState<IconWithAliases[]>(
    []
  )
  const [selectedIcon, setSelectedIcon] = useState<IconWithAliases | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadIcons() {
      const iconEntries = Object.entries(LucideIcons)
        .filter(([name]) => name !== "createLucideIcon")
        .slice(0, 50)

      const shouldRefresh = shouldRefreshCache()

      const loadedIcons = await Promise.all(
        iconEntries.map(async ([name, Icon]) => {
          let aliases: string[]
          if (shouldRefresh) {
            aliases = await generateAliasesWithAI(name)
            localStorage.setItem(
              `icon_aliases_${name}`,
              JSON.stringify(aliases)
            )
          } else {
            aliases = await getAliasesWithCache(name)
          }
          return { name, Icon, aliases }
        })
      )

      setIconsWithAliases(loadedIcons)
      setSelectedIcon(loadedIcons[0])
      setIsLoading(false)

      if (shouldRefresh) {
        localStorage.setItem(
          "last_cache_refresh",
          new Date().getTime().toString()
        )
      }
    }

    loadIcons()
  }, [])

  const filteredIcons = iconsWithAliases.filter(
    ({ name, aliases }) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aliases.some((alias) =>
        alias.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  return (
    <>
      <Input
        type="search"
        placeholder="search for an icon..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-10 bg-white"
      />
      <div className="flex flex-col md:flex-row gap-8">
        <ScrollArea className="h-[70vh] flex-grow">
          <div className="grid grid-cols-6 gap-2 py-4">
            {isLoading
              ? Array.from({ length: 50 }).map((_, index) => (
                  <IconSkeleton key={index} />
                ))
              : filteredIcons.map((icon) => (
                  <button
                    key={icon.name}
                    onClick={() => setSelectedIcon(icon)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg hover:bg-slate-100 hover:border hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent aspect-square overflow-hidden",
                      {
                        "bg-slate-100 border border-gray-200":
                          selectedIcon === icon,
                      }
                    )}
                  >
                    <icon.Icon className="w-6 h-6" />
                    <span className="text-xs mt-2 text-center text-clip overflow-hidden ...">
                      {icon.name}
                    </span>
                  </button>
                ))}
          </div>
        </ScrollArea>
        <div className="w-full md:w-1/3">
          <IconDetailView icon={selectedIcon} />
        </div>
      </div>
    </>
  )
}

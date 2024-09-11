'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import * as LucideIcons from "lucide-react"
import { Download } from "lucide-react"

import { cn } from "@/lib/utils"

function formatIconName(name: string): string {
  return name
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function generateAliasesWithAI(iconName: string): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const formattedName = formatIconName(iconName).toLowerCase();
  const baseAliases = formattedName.split(' ');
  const extraAliases = [
    'symbol',
    'sign',
    'pictogram',
    formattedName.replace(/\s/g, ''),
    baseAliases.join('-')
  ];
  return [...baseAliases, ...extraAliases].slice(0, 5);
}

interface IconWithAliases {
  name: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  aliases: string[];
}

function IconDetailView({ icon }: { icon: IconWithAliases | null }) {
  if (!icon) return null;

  const { name, Icon, aliases } = icon;

  return (
    <Card className="h-full my-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <Icon className="w-8 h-8" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {aliases.map((alias, index) => (
              <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                {alias}
              </span>
            ))}
          </div>
        </div>
        <Button className="w-full" variant="outline">
          <Download className="mr-2 h-4 w-4" /> Download SVG
        </Button>
        <div>
          <h3 className="font-semibold mb-2">Installation</h3>
          <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
            <code>{`import { ${name} } from 'lucide-react'`}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IconLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [iconsWithAliases, setIconsWithAliases] = useState<IconWithAliases[]>([])
  const [selectedIcon, setSelectedIcon] = useState<IconWithAliases | null>(null)

  useEffect(() => {
    const loadIconsWithAliases = async () => {
      const iconEntries = Object.entries(LucideIcons)
        .filter(([name]) => name !== 'createLucideIcon')
        .slice(0, 100);

      const iconsWithAliasesPromises = iconEntries.map(async ([name, Icon]) => {
        const aliases = await generateAliasesWithAI(name);
        return { name, Icon, aliases };
      });

      const loadedIcons = await Promise.all(iconsWithAliasesPromises);
      setIconsWithAliases(loadedIcons);
      setSelectedIcon(loadedIcons[0]);
    };

    loadIconsWithAliases();
  }, []);

  const filteredIcons = iconsWithAliases.filter(({ name, aliases }) => 
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aliases.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Bibliothèque d'icônes</h1>
      <Input
        type="search"
        placeholder="Rechercher une icône..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      <div className="flex flex-col md:flex-row gap-4">
        <ScrollArea className="h-[70vh] flex-grow">
          <div className="grid grid-cols-6 gap-4 p-4">
            {filteredIcons.map((icon) => (
              <button 
                key={icon.name}
                onClick={() => setSelectedIcon(icon)}
                className={cn("flex flex-col items-center justify-center p-2 border rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent aspect-square overflow-hidden", {'bg-accent' : selectedIcon === icon} )}
              >
                <icon.Icon className="w-4 h-4" />
                <span className="text-xs mt-2 text-center text-clip overflow-hidden ...">{icon.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="w-full md:w-1/3">
          <IconDetailView icon={selectedIcon} />
        </div>
      </div>
    </div>
  )
}
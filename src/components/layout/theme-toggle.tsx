'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/30"
            onClick={cycleTheme}
          >
            {theme === 'light' && <Sun className="h-4 w-4 text-amber-500" />}
            {theme === 'dark' && <Moon className="h-4 w-4 text-blue-400" />}
            {theme === 'system' && <Monitor className="h-4 w-4 text-muted-foreground" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {theme === 'light' && 'Light mode'}
            {theme === 'dark' && 'Dark mode'}
            {theme === 'system' && 'System theme'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


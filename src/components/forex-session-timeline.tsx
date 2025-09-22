
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Session = {
  name: string;
  start: number; // UTC hour
  end: number; // UTC hour
  color: string;
};

const SESSIONS: Session[] = [
  { name: 'Tokyo', start: 0, end: 9, color: 'bg-pink-500' },
  { name: 'London', start: 8, end: 17, color: 'bg-sky-500' },
  { name: 'New York', start: 13, end: 22, color: 'bg-green-500' },
];

export function ForexSessionTimeline({ hasNews }: { hasNews: boolean }) {
  const [currentHour, setCurrentHour] = useState(new Date().getUTCHours() + new Date().getUTCMinutes() / 60);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentHour(now.getUTCHours() + now.getUTCMinutes() / 60);
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const progressPercent = (currentHour / 24) * 100;

  return (
    <TooltipProvider>
      <div className="space-y-3 pt-4">
        <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
          {SESSIONS.map(session => {
            const width = ((session.end - session.start) / 24) * 100;
            const left = (session.start / 24) * 100;

            // Handle overlap styling
            const overlapClasses: string[] = [];
            if (session.name === 'London') {
              // London-Tokyo overlap
              overlapClasses.push(`
                before:content-[''] before:absolute before:left-0 before:top-0 before:h-full
                before:w-[${(1/9)*100}%] before:bg-gradient-to-r before:from-pink-500 before:to-sky-500
              `);
            }
            if (session.name === 'New York') {
               // New York-London overlap
               overlapClasses.push(`
                before:content-[''] before:absolute before:left-0 before:top-0 before:h-full
                before:w-[${(4/9)*100}%] before:bg-gradient-to-r before:from-sky-500 before:to-green-500
              `);
            }
            
            return (
              <Tooltip key={session.name}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'absolute top-0 h-full flex items-center justify-center',
                      session.color,
                      ...overlapClasses
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="text-xs font-medium text-white/90 z-10">{session.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.name} Session</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute -top-3 h-8 w-1 text-primary"
                style={{ left: `${progressPercent}%`, transition: 'left 60s linear' }}
              >
                  <MapPin className="h-full w-full" fill="currentColor" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Current Time (UTC)</p>
            </TooltipContent>
          </Tooltip>

          {hasNews && (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="absolute top-0.5 right-2 h-5 w-5 text-yellow-400 animate-pulse">
                        <AlertTriangle className="h-full w-full" fill="currentColor" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Upcoming news on a budgeted pair!</p>
                </TooltipContent>
            </Tooltip>
          )}

        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>24:00</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

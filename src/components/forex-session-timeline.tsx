
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
  start: number; // PHT hour (UTC+8)
  end: number;   // PHT hour (UTC+8)
  color: string;
};

// Session times converted from UTC to PHT (UTC+8)
const SESSIONS: Session[] = [
    // Tokyo: 00:00-09:00 UTC -> 08:00-17:00 PHT
    { name: 'Tokyo', start: 8, end: 17, color: 'bg-pink-500' },
    // London: 08:00-17:00 UTC -> 16:00-01:00 (next day) PHT
    { name: 'London', start: 16, end: 25, color: 'bg-sky-500' }, // Use 25 to represent 1 AM next day for calculation
    // New York: 13:00-22:00 UTC -> 21:00-06:00 (next day) PHT
    { name: 'New York', start: 21, end: 30, color: 'bg-green-500' }, // Use 30 to represent 6 AM next day
];


export function ForexSessionTimeline({ hasNews }: { hasNews: boolean }) {
  const [currentHourPHT, setCurrentHourPHT] = useState(0);

  useEffect(() => {
    const updateCurrentTime = () => {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        // Manila is UTC+8
        setCurrentHourPHT((utcHours + 8) % 24 + utcMinutes / 60);
    };

    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const progressPercent = (currentHourPHT / 24) * 100;

  const renderSession = (session: Session) => {
    const sessionElements = [];
    
    // Handle sessions that wrap around midnight
    if (session.end > 24) {
      // Part 1: From start time to midnight
      const width1 = ((24 - session.start) / 24) * 100;
      const left1 = (session.start / 24) * 100;
      sessionElements.push(
        <div
            key={`${session.name}-1`}
            className={cn('absolute top-0 h-full', session.color)}
            style={{ left: `${left1}%`, width: `${width1}%` }}
        />
      );
      // Part 2: From midnight to end time
      const width2 = ((session.end % 24) / 24) * 100;
      sessionElements.push(
        <div
            key={`${session.name}-2`}
            className={cn('absolute top-0 h-full', session.color)}
            style={{ left: `0%`, width: `${width2}%` }}
        />
      );
    } else {
        const width = ((session.end - session.start) / 24) * 100;
        const left = (session.start / 24) * 100;
        sessionElements.push(
          <div
            key={session.name}
            className={cn('absolute top-0 h-full', session.color)}
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        );
    }

    // Add session name centered within the main block
    const isOverlappingNY = session.name === 'New York';
    const totalDuration = isOverlappingNY ? (30-21) : (session.end - session.start);
    const centerPosition = (session.start + totalDuration / 2) % 24;
    const centerPercent = (centerPosition / 24) * 100;

    return (
      <React.Fragment key={`${session.name}-fragment`}>
        {sessionElements}
         <Tooltip>
            <TooltipTrigger asChild>
                <div 
                    className="absolute top-0 h-full flex items-center justify-center z-10"
                    style={{ left: `${centerPercent}%`, transform: 'translateX(-50%)' }}
                >
                    <span className="text-xs font-medium text-white/90">{session.name}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{session.name} Session</p>
            </TooltipContent>
        </Tooltip>
      </React.Fragment>
    );
  };
  

  return (
    <TooltipProvider>
      <div className="space-y-3 pt-4">
        <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
          {/* Base session colors */}
          {SESSIONS.map(renderSession)}

          {/* Overlap Gradients */}
          {/* London-Tokyo Overlap (16:00-17:00 PHT) */}
          <div className="absolute top-0 h-full bg-gradient-to-r from-pink-500 to-sky-500"
               style={{ left: `${(16/24)*100}%`, width: `${(1/24)*100}%` }} />
          
          {/* NY-London Overlap (21:00-01:00 PHT) */}
          <div className="absolute top-0 h-full bg-gradient-to-r from-sky-500 to-green-500"
               style={{ left: `${(21/24)*100}%`, width: `${(4/24)*100}%` }} />


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
                <p>Current Time (PHT)</p>
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
            <span>12AM</span>
            <span>4AM</span>
            <span>8AM</span>
            <span>12PM</span>
            <span>4PM</span>
            <span>8PM</span>
            <span className="pr-1">12AM</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

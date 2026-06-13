"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Archive, Clock } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface SwipeableThreadRowProps {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
}

const SWIPE_THRESHOLD = 72;

export function SwipeableThreadRow({
  children,
  className,
  onClick,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
}: SwipeableThreadRowProps) {
  const x = useMotionValue(0);
  const archiveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const snoozeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const longPressTimer = useRef<number | null>(null);
  const didLongPress = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-emerald-500/15 text-emerald-400"
        style={{ opacity: archiveOpacity }}
      >
        <Archive className="h-4 w-4" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-amber-500/15 text-amber-300"
        style={{ opacity: snoozeOpacity }}
      >
        <Clock className="h-4 w-4" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        style={{ x }}
        className={cn("relative bg-background", className)}
        onDragEnd={(_, info) => {
          if (info.offset.x >= SWIPE_THRESHOLD) onSwipeRight?.();
          if (info.offset.x <= -SWIPE_THRESHOLD) onSwipeLeft?.();
          x.set(0);
        }}
        onPointerDown={() => {
          didLongPress.current = false;
          clearLongPress();
          if (!onLongPress) return;
          longPressTimer.current = window.setTimeout(() => {
            didLongPress.current = true;
            onLongPress();
          }, 500);
        }}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        onClick={() => {
          if (didLongPress.current) return;
          onClick();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

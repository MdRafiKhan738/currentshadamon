"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RiCheckboxCircleFill } from "react-icons/ri";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Placement = "top" | "bottom";

type TooltipPosition = {
  top: number;
  left: number; // center x in viewport coordinates
  placement: Placement;
  arrowLeft: number; // px from tooltip left edge
};

type VerifiedBadgeProps = {
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
  tooltipText?: React.ReactNode;
  tooltipWidthClassName?: string;
};

export default function VerifiedBadge({
  className,
  iconClassName,
  tooltipClassName,
  tooltipWidthClassName,
  tooltipText = (
    <>
      <span className="font-bold text-black">Verified</span> by mobile number & additional checks to ensure authenticity.
    </>
  ),
}: VerifiedBadgeProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TooltipPosition | null>(null);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const gap = 8;
    const padding = 8;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const centerX = triggerRect.left + triggerRect.width / 2;

    const desiredTop = triggerRect.top - tooltipRect.height - gap;
    const desiredBottom = triggerRect.bottom + gap;

    let placement: Placement = "top";
    let top = desiredTop;
    if (top < padding && desiredBottom + tooltipRect.height <= viewportH - padding) {
      placement = "bottom";
      top = desiredBottom;
    } else if (top < padding) {
      // If it doesn't fit either way, clamp within viewport.
      top = Math.max(padding, Math.min(desiredBottom, viewportH - padding - tooltipRect.height));
      placement = top >= triggerRect.bottom ? "bottom" : "top";
    }

    const halfW = tooltipRect.width / 2;
    const clampedCenterX = Math.max(padding + halfW, Math.min(centerX, viewportW - padding - halfW));

    // Arrow should point at the trigger center, even when tooltip is clamped.
    const tooltipLeftEdge = clampedCenterX - halfW;
    const rawArrowLeft = centerX - tooltipLeftEdge;
    const arrowLeft = Math.max(12, Math.min(rawArrowLeft, tooltipRect.width - 12));

    setPos({ top, left: clampedCenterX, placement, arrowLeft });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onReflow = () => updatePosition();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, updatePosition]);

  return (
    <span
      ref={triggerRef}
      className={cn("inline-flex items-center justify-center", className)}
      onMouseEnter={() => {
        setPos(null);
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <RiCheckboxCircleFill
        className={cn("w-3.5 h-3.5 text-[#0088cc] shrink-0 cursor-pointer", iconClassName)}
      />

      {mounted && open
        ? createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              "fixed pointer-events-none z-[9999] bg-white/95 backdrop-blur-[2px] border border-slate-200/90 shadow-[0_12px_26px_rgba(15,23,42,0.16)] rounded-xl px-2.5 py-2 animate-in fade-in zoom-in-95 duration-200 text-left",
              pos ? "opacity-100" : "opacity-0",
              tooltipWidthClassName ?? "w-[170px] sm:w-[190px]",
              tooltipClassName
            )}
            style={
              pos
                ? {
                  top: pos.top,
                  left: pos.left,
                  transform: "translateX(-50%)",
                }
                : undefined
            }
          >
            <p className="text-[12px] text-slate-700 font-medium leading-[1.15] whitespace-normal break-words normal-case">{tooltipText}</p>

            <div
              className={cn(
                "absolute -translate-x-1/2",
                pos?.placement === "bottom" ? "bottom-full -mb-[1px]" : "top-full -mt-[1px]"
              )}
              style={pos ? { left: pos.arrowLeft } : undefined}
            >
              <div className="w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45" />
            </div>
          </div>,
          document.body
        )
        : null}
    </span>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export function SignaturePad({
  onChange,
  disabled = false,
  className = '',
}: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const hasInkRef = useRef(false);
  const scrollLockRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const getPoint = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    [],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f172a';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [resizeCanvas]);

  const emitChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onChange(null);
      return;
    }
    onChange(canvas.toDataURL('image/png'));
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventTouchScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    const restoreScrollPosition = () => {
      const locked = scrollLockRef.current;
      if (!locked || !isDrawingRef.current) return;
      if (
        window.scrollX !== locked.x ||
        window.scrollY !== locked.y
      ) {
        window.scrollTo(locked.x, locked.y);
      }
    };

    container.addEventListener('touchstart', preventTouchScroll, {
      passive: false,
    });
    container.addEventListener('touchmove', preventTouchScroll, {
      passive: false,
    });
    window.addEventListener('scroll', restoreScrollPosition, { passive: true });

    return () => {
      container.removeEventListener('touchstart', preventTouchScroll);
      container.removeEventListener('touchmove', preventTouchScroll);
      window.removeEventListener('scroll', restoreScrollPosition);
    };
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    hasInkRef.current = false;
    setHasInk(false);
    onChange(null);
  }, [onChange]);

  const drawLine = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.preventDefault();
    scrollLockRef.current = {
      x: window.scrollX,
      y: window.scrollY,
    };
    const canvas = canvasRef.current;
    canvas?.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    lastPointRef.current = getPoint(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawingRef.current) return;
    event.preventDefault();
    const point = getPoint(event);
    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      drawLine(lastPoint, point);
      hasInkRef.current = true;
      setHasInk(true);
    }
    lastPointRef.current = point;
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    scrollLockRef.current = null;
    lastPointRef.current = null;
    if (hasInkRef.current) {
      emitChange();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        ref={containerRef}
        className="touch-none overscroll-none rounded-md border-2 border-dashed border-primary/50 bg-white"
      >
        <canvas
          ref={canvasRef}
          className="block h-32 w-full min-h-[128px] touch-none cursor-crosshair select-none sm:h-36 sm:min-h-[160px]"
          aria-label="Draw your signature here"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] text-muted-foreground sm:text-xs">
          Draw your signature inside the box above using your mouse or finger.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={disabled || !hasInk}
        >
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          Clear Signature
        </Button>
      </div>
    </div>
  );
}

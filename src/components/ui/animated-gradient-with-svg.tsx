import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDimensions } from "@/components/hooks/use-debounced-dimensions";

interface AnimatedGradientProps {
  colors: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
}

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors,
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height]
  );

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
      ? "blur-3xl"
      : "blur-[100px]";

  const circles = useMemo(() => {
    return colors.map((color, index) => ({
      color,
      top: `${Math.random() * 50}%`,
      left: `${Math.random() * 50}%`,
      tx1: Math.random() - 0.5,
      ty1: Math.random() - 0.5,
      tx2: Math.random() - 0.5,
      ty2: Math.random() - 0.5,
      tx3: Math.random() - 0.5,
      ty3: Math.random() - 0.5,
      tx4: Math.random() - 0.5,
      ty4: Math.random() - 0.5,
      scale: randomInt(0.5, 1.5)
    }));
  }, [colors]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {circles.map((circle, index) => (
          <svg
            key={index}
            className="absolute animate-background-gradient will-change-transform"
            style={
              {
                top: circle.top,
                left: circle.left,
                "--background-gradient-speed": `${1 / speed}s`,
                "--tx-1": circle.tx1,
                "--ty-1": circle.ty1,
                "--tx-2": circle.tx2,
                "--ty-2": circle.ty2,
                "--tx-3": circle.tx3,
                "--ty-3": circle.ty3,
                "--tx-4": circle.tx4,
                "--ty-4": circle.ty4,
              } as React.CSSProperties
            }
            width={circleSize * circle.scale}
            height={circleSize * circle.scale}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={circle.color}
              className="opacity-30 dark:opacity-[0.15]"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

export { AnimatedGradient };

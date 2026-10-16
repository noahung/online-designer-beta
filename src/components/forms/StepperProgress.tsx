import React from 'react';
import { Check } from 'lucide-react';
import { FormThemeConfig } from '../../lib/formThemes';

interface StepperProgressProps {
  currentStepIndex: number;
  totalSteps: number;
  steps?: Array<{ title?: string; id?: string }>;
  themeConfig: FormThemeConfig;
  primaryColor?: string;
  variant?: 'numbers' | 'bar' | 'dots';
  onStepClick?: (index: number) => void;
  allowStepNavigation?: boolean;
}

export const StepperProgress: React.FC<StepperProgressProps> = ({
  currentStepIndex,
  totalSteps,
  steps,
  themeConfig,
  primaryColor,
  variant = 'numbers',
  onStepClick,
  allowStepNavigation = false,
}) => {
  if (totalSteps <= 1) return null;

  const percent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);
  const activeColor = primaryColor || themeConfig.preview.primaryColor;

  if (variant === 'bar') {
    return (
      <div className="w-full space-y-1 mb-6">
        <div className={themeConfig.styles.progress.track}>
          <div
            className={themeConfig.styles.progress.bar}
            style={{
              width: `${percent}%`,
              ...(primaryColor ? { backgroundColor: primaryColor } : {})
            }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 font-medium px-0.5">
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          <span>{percent}%</span>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < currentStepIndex;
          const isActive = i === currentStepIndex;

          return (
            <button
              key={i}
              type="button"
              disabled={!allowStepNavigation && !isCompleted}
              onClick={() => onStepClick && onStepClick(i)}
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? 'w-8 h-2.5 bg-indigo-600'
                  : isCompleted
                  ? 'w-2.5 h-2.5 bg-indigo-400'
                  : 'w-2.5 h-2.5 bg-slate-200'
              } ${allowStepNavigation || isCompleted ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              style={{
                ...(isActive || isCompleted
                  ? { backgroundColor: activeColor }
                  : {})
              }}
              title={`Step ${i + 1}`}
            />
          );
        })}
      </div>
    );
  }

  // Default: BetterStack-style numbered stepped sequence (1) — (2) — (3)
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-center max-w-sm sm:max-w-md mx-auto relative px-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < currentStepIndex;
          const isActive = i === currentStepIndex;
          const isLast = i === totalSteps - 1;

          return (
            <React.Fragment key={i}>
              <button
                type="button"
                disabled={!allowStepNavigation && !isCompleted}
                onClick={() => onStepClick && (allowStepNavigation || isCompleted) && onStepClick(i)}
                className={`relative z-10 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? themeConfig.styles.progress.stepperDotActive
                    : isCompleted
                    ? themeConfig.styles.progress.stepperDotCompleted
                    : themeConfig.styles.progress.stepperDotInactive
                } ${allowStepNavigation || isCompleted ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                style={{
                  ...(isActive
                    ? { backgroundColor: activeColor, borderColor: activeColor }
                    : isCompleted
                    ? { backgroundColor: activeColor, opacity: 0.85 }
                    : {})
                }}
                title={steps?.[i]?.title || `Step ${i + 1}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </button>

              {!isLast && (
                <div
                  className={`flex-1 h-0.5 sm:h-1 mx-1.5 sm:mx-2 rounded-full transition-all duration-500 ${
                    i < currentStepIndex
                      ? themeConfig.styles.progress.stepperLineActive
                      : themeConfig.styles.progress.stepperLineInactive
                  }`}
                  style={{
                    ...(i < currentStepIndex && activeColor
                      ? { backgroundColor: activeColor }
                      : {})
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

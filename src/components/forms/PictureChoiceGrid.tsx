import React from 'react';
import { Check } from 'lucide-react';
import { FormThemeConfig } from '../../lib/formThemes';

export interface PictureOption {
  id: string;
  label: string;
  description?: string;
  image_url?: string;
  price?: number;
}

interface PictureChoiceGridProps {
  options: PictureOption[];
  selectedOptionId?: string;
  onSelect: (option: PictureOption) => void;
  themeConfig: FormThemeConfig;
  primaryColor?: string;
  desktopColumns?: number; // 1, 2, 3, 4
  mobileColumns?: number; // 1, 2, 3
  cropImagesToSquare?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  showKeyboardShortcuts?: boolean;
}

export const PictureChoiceGrid: React.FC<PictureChoiceGridProps> = ({
  options,
  selectedOptionId,
  onSelect,
  themeConfig,
  primaryColor,
  desktopColumns = 2,
  mobileColumns = 1,
  cropImagesToSquare = true,
  aspectRatio = 'square',
  showKeyboardShortcuts = true,
}) => {
  // Compute responsive Tailwind grid classes
  const getGridClasses = () => {
    let mobileClass = 'grid-cols-1';
    if (mobileColumns === 2) mobileClass = 'grid-cols-2';
    if (mobileColumns === 3) mobileClass = 'grid-cols-3';

    let desktopClass = 'sm:grid-cols-2';
    if (desktopColumns === 1) desktopClass = 'sm:grid-cols-1';
    if (desktopColumns === 2) desktopClass = 'sm:grid-cols-2';
    if (desktopColumns === 3) desktopClass = 'sm:grid-cols-2 lg:grid-cols-3';
    if (desktopColumns === 4) desktopClass = 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

    return `grid gap-3.5 sm:gap-4.5 ${mobileClass} ${desktopClass}`;
  };

  const getAspectClass = () => {
    if (!cropImagesToSquare && aspectRatio === 'auto') return 'h-auto min-h-[120px]';
    switch (aspectRatio) {
      case 'video': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      case 'square':
      default: return 'aspect-square';
    }
  };

  const shortcutKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div className={getGridClasses()}>
      {options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;
        const shortcut = shortcutKeys[index] || `${index + 1}`;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`${themeConfig.styles.choiceCard.base} ${
              isSelected
                ? themeConfig.styles.choiceCard.selected
                : themeConfig.styles.choiceCard.hover
            }`}
            style={{
              ...(isSelected && primaryColor
                ? {
                    borderColor: primaryColor,
                    boxShadow: `0 0 0 2px ${primaryColor}, 0 8px 24px ${primaryColor}25`
                  }
                : {})
            }}
          >
            {/* Top Image Container */}
            {option.image_url ? (
              <div className={`w-full ${themeConfig.styles.choiceCard.imageWrap} ${getAspectClass()} relative overflow-hidden flex items-center justify-center`}>
                <img
                  src={option.image_url}
                  alt={option.label}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />

                {/* Keyboard Shortcut Tag */}
                {showKeyboardShortcuts && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-sm">
                      {shortcut}
                    </span>
                  </div>
                )}

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10 animate-fade-in">
                    <div
                      className={themeConfig.styles.choiceCard.badge}
                      style={{
                        ...(primaryColor ? { backgroundColor: primaryColor } : {})
                      }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* If no image, show compact card badge */
              <div className="flex items-center justify-between w-full mb-2">
                {showKeyboardShortcuts && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {shortcut}
                  </span>
                )}
                {isSelected && (
                  <div
                    className={themeConfig.styles.choiceCard.badge}
                    style={{
                      ...(primaryColor ? { backgroundColor: primaryColor } : {})
                    }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            )}

            {/* Label and Details */}
            <div className="flex-1 flex flex-col justify-between w-full">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base leading-snug">
                  {option.label}
                </span>
                {option.price != null && option.price > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    +${option.price}
                  </span>
                )}
              </div>

              {option.description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {option.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

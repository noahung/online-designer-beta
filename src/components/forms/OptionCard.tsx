import React from 'react';
import { Check } from 'lucide-react';
import { FormThemeConfig } from '../../lib/formThemes';

export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  price?: number;
}

interface OptionCardProps {
  options: ChoiceOption[];
  selectedOptionId?: string;
  onSelect: (option: ChoiceOption) => void;
  themeConfig: FormThemeConfig;
  primaryColor?: string;
  showKeyboardShortcuts?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  options,
  selectedOptionId,
  onSelect,
  themeConfig,
  primaryColor,
  showKeyboardShortcuts = true,
}) => {
  const shortcutKeys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
      {options.map((option, index) => {
        const isSelected = selectedOptionId === option.id;
        const shortcut = shortcutKeys[index] || `${index + 1}`;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option)}
            className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 ease-out flex items-center justify-between gap-4 border cursor-pointer ${
              isSelected
                ? 'bg-indigo-50/40 border-indigo-600 ring-2 ring-indigo-600 shadow-md shadow-indigo-500/10'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm'
            }`}
            style={{
              ...(isSelected && primaryColor
                ? {
                    borderColor: primaryColor,
                    boxShadow: `0 0 0 2px ${primaryColor}, 0 4px 16px ${primaryColor}15`
                  }
                : {})
            }}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {showKeyboardShortcuts && (
                <span
                  className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  style={{
                    ...(isSelected && primaryColor ? { backgroundColor: primaryColor } : {})
                  }}
                >
                  {shortcut}
                </span>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm sm:text-base leading-snug truncate">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-normal">
                    {option.description}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {option.price != null && option.price > 0 && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  +${option.price}
                </span>
              )}

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 bg-transparent'
                }`}
                style={{
                  ...(isSelected && primaryColor ? { backgroundColor: primaryColor, borderColor: primaryColor } : {})
                }}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

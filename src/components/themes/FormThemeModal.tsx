import React, { useState } from 'react';
import { Palette, X, Sparkles, Sliders, Type, Check, Eye } from 'lucide-react';
import { formThemes, FormTheme, FormThemeConfig } from '../../lib/formThemes';

interface FormThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onSelectTheme: (theme: FormTheme) => void;
  primaryButtonColor: string;
  onChangePrimaryButtonColor: (color: string) => void;
  primaryButtonTextColor: string;
  onChangePrimaryButtonTextColor: (color: string) => void;
  secondaryButtonColor: string;
  onChangeSecondaryButtonColor: (color: string) => void;
  secondaryButtonTextColor: string;
  onChangeSecondaryButtonTextColor: (color: string) => void;
  systemTheme?: 'light' | 'dark';
}

type TabType = 'presets' | 'buttons' | 'typography';

export const FormThemeModal: React.FC<FormThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  primaryButtonColor,
  onChangePrimaryButtonColor,
  primaryButtonTextColor,
  onChangePrimaryButtonTextColor,
  secondaryButtonColor,
  onChangeSecondaryButtonColor,
  secondaryButtonTextColor,
  onChangeSecondaryButtonTextColor,
  systemTheme = 'dark',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  if (!isOpen) return null;

  const colorPresets = [
    { label: 'Indigo', bg: '#4F46E5', text: '#FFFFFF' },
    { label: 'Blue', bg: '#2563EB', text: '#FFFFFF' },
    { label: 'Emerald', bg: '#059669', text: '#FFFFFF' },
    { label: 'Amber', bg: '#D97706', text: '#FFFFFF' },
    { label: 'Rose', bg: '#E11D48', text: '#FFFFFF' },
    { label: 'Purple', bg: '#7C3AED', text: '#FFFFFF' },
    { label: 'Dark Slate', bg: '#0F172A', text: '#FFFFFF' },
    { label: 'Warm Stone', bg: '#292524', text: '#FAF7F2' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border ${
          systemTheme === 'light'
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#121826] border-slate-700/80 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            systemTheme === 'light'
              ? 'bg-slate-50/90 border-slate-200'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Form Theme & Presentation</h2>
              <p className="text-xs text-slate-400">
                Customize appearance, colors, and styling for all forms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex items-center gap-2 px-6 pt-3 pb-2 border-b text-sm font-semibold ${
            systemTheme === 'light'
              ? 'bg-slate-100/70 border-slate-200 text-slate-600'
              : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Theme Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'buttons'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Button Colors</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">
                  Choose a Presentation Style
                </h3>
                <p className="text-xs text-slate-400">
                  Presets style the card container, inputs, typography, progress stepper, and choice cards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.entries(formThemes) as [FormTheme, FormThemeConfig][]).map(([key, config]) => {
                  const isSelected = currentTheme === key;

                  return (
                    <div
                      key={key}
                      onClick={() => onSelectTheme(key)}
                      className={`group relative p-4 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                          : systemTheme === 'light'
                          ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base">{config.name}</h4>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-indigo-400 font-medium">
                              {config.subtitle}
                            </p>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-600 bg-transparent text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                          {config.description}
                        </p>
                      </div>

                      {/* Realistic Miniature Form Card Preview */}
                      <div
                        className={`p-3 rounded-xl ${config.preview.bgPreviewClass} border border-slate-700/40 relative overflow-hidden`}
                      >
                        <div
                          className={`p-3 rounded-lg ${config.preview.cardPreviewClass} space-y-2`}
                        >
                          {/* Mini Stepper */}
                          <div className="flex items-center justify-between gap-1 max-w-[120px] mx-auto mb-1">
                            <div className="w-3 h-3 rounded-full bg-indigo-600 text-[8px] text-white font-bold flex items-center justify-center">
                              1
                            </div>
                            <div className="flex-1 h-0.5 bg-indigo-600 rounded-full" />
                            <div className="w-3 h-3 rounded-full bg-slate-300 text-[8px] text-slate-600 font-bold flex items-center justify-center">
                              2
                            </div>
                          </div>

                          {/* Mini Heading Line */}
                          <div className="h-2 w-3/4 bg-slate-800 rounded mb-1" />

                          {/* Mini Input Box */}
                          <div className="h-5 w-full rounded border border-slate-300/80 bg-white/70 flex items-center px-1.5">
                            <div className="h-1.5 w-1/3 bg-slate-400/80 rounded-full" />
                          </div>

                          {/* Mini Button */}
                          <div className="flex justify-end pt-1">
                            <div
                              className="h-4 px-3 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: config.preview.primaryColor }}
                            >
                              Next →
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BUTTON COLORS */}
          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-1">
                  Button & Action Styling
                </h3>
                <p className="text-xs text-slate-400">
                  Override default theme colors with custom brand palettes.
                </p>
              </div>

              {/* Quick Swatch Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Quick Brand Palettes
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        onChangePrimaryButtonColor(preset.bg);
                        onChangePrimaryButtonTextColor(preset.text);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium transition-all"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                        style={{ backgroundColor: preset.bg }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Next Button */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-indigo-300">
                      Primary (Next) Button
                    </h4>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold shadow-xs"
                      style={{
                        backgroundColor: primaryButtonColor,
                        color: primaryButtonTextColor,
                      }}
                    >
                      Preview Button
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryButtonColor}
                          onChange={(e) => onChangePrimaryButtonColor(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={primaryButtonColor}
                          onChange={(e) => onChangePrimaryButtonColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryButtonTextColor}
                          onChange={(e) => onChangePrimaryButtonTextColor(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={primaryButtonTextColor}
                          onChange={(e) => onChangePrimaryButtonTextColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Button */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-slate-300">
                      Secondary (Previous) Button
                    </h4>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-semibold border border-slate-600 shadow-xs"
                      style={{
                        backgroundColor: secondaryButtonColor,
                        color: secondaryButtonTextColor,
                      }}
                    >
                      Back
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryButtonColor}
                          onChange={(e) => onChangeSecondaryButtonColor(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={secondaryButtonColor}
                          onChange={(e) => onChangeSecondaryButtonColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryButtonTextColor}
                          onChange={(e) => onChangeSecondaryButtonTextColor(e.target.value)}
                          className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={secondaryButtonTextColor}
                          onChange={(e) => onChangeSecondaryButtonTextColor(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            systemTheme === 'light'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="text-xs text-slate-400">
            Selected: <span className="text-indigo-400 font-semibold">{formThemes[currentTheme as FormTheme]?.name || 'Modern Clean'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all shadow-md"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};

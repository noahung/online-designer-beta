import React, { useState } from 'react';
import { X, Sparkles, Sliders, FileText, Building2, Check, Palette, CornerDownRight } from 'lucide-react';
import { formThemes, FormTheme, FormThemeConfig, getThemeConfig } from '../../lib/formThemes';

export type SettingsDrawerTab = 'theme' | 'buttons' | 'general' | 'client';

interface OpenAISettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsDrawerTab;
  // Form General fields
  formTitle: string;
  onChangeFormTitle: (val: string) => void;
  internalName: string;
  onChangeInternalName: (val: string) => void;
  description: string;
  onChangeDescription: (val: string) => void;
  welcomeMessage: string;
  onChangeWelcomeMessage: (val: string) => void;
  clientId: string | null;
  onChangeClientId: (val: string) => void;
  clients: Array<{ id: string; name: string; logo_url?: string }>;
  // Theme & Styling fields
  formTheme: FormTheme;
  onChangeFormTheme: (theme: FormTheme) => void;
  primaryButtonColor: string;
  onChangePrimaryButtonColor: (color: string) => void;
  primaryButtonTextColor: string;
  onChangePrimaryButtonTextColor: (color: string) => void;
  secondaryButtonColor: string;
  onChangeSecondaryButtonColor: (color: string) => void;
  secondaryButtonTextColor: string;
  onChangeSecondaryButtonTextColor: (color: string) => void;
  buttonRadius?: string; // 'none' | 'md' | 'xl' | 'full'
  onChangeButtonRadius?: (radius: string) => void;
  cardRadius?: string; // 'none' | 'xl' | '2xl' | '3xl'
  onChangeCardRadius?: (radius: string) => void;
  systemTheme?: 'light' | 'dark';
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
}

export const OpenAISettingsDrawer: React.FC<OpenAISettingsDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'theme',
  formTitle,
  onChangeFormTitle,
  internalName,
  onChangeInternalName,
  description,
  onChangeDescription,
  welcomeMessage,
  onChangeWelcomeMessage,
  clientId,
  onChangeClientId,
  clients,
  formTheme,
  onChangeFormTheme,
  primaryButtonColor,
  onChangePrimaryButtonColor,
  primaryButtonTextColor,
  onChangePrimaryButtonTextColor,
  secondaryButtonColor,
  onChangeSecondaryButtonColor,
  secondaryButtonTextColor,
  onChangeSecondaryButtonTextColor,
  buttonRadius = 'xl',
  onChangeButtonRadius,
  cardRadius = '2xl',
  onChangeCardRadius,
  systemTheme = 'dark',
  onSave,
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsDrawerTab>(initialTab);
  const [isSavingInternal, setIsSavingInternal] = useState(false);

  const handleSaveAndDone = async () => {
    if (onSave) {
      setIsSavingInternal(true);
      try {
        await onSave();
      } catch (e) {
        console.error('Error saving form from drawer:', e);
      } finally {
        setIsSavingInternal(false);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const colorPresets = [
    { label: 'Indigo', bg: '#4F46E5', text: '#FFFFFF' },
    { label: 'Electric Blue', bg: '#2563EB', text: '#FFFFFF' },
    { label: 'Emerald', bg: '#059669', text: '#FFFFFF' },
    { label: 'Amber', bg: '#D97706', text: '#FFFFFF' },
    { label: 'Rose Pink', bg: '#E11D48', text: '#FFFFFF' },
    { label: 'Purple Violet', bg: '#7C3AED', text: '#FFFFFF' },
    { label: 'Obsidian', bg: '#0F172A', text: '#FFFFFF' },
    { label: 'Warm Stone', bg: '#292524', text: '#FAF7F2' },
  ];

  const buttonRadiusOptions = [
    { id: 'none', label: 'Sharp', previewClass: 'rounded-none' },
    { id: 'md', label: 'Subtle (8px)', previewClass: 'rounded-lg' },
    { id: 'xl', label: 'Rounded (14px)', previewClass: 'rounded-xl' },
    { id: 'full', label: 'Full Pill', previewClass: 'rounded-full' },
  ];

  const cardRadiusOptions = [
    { id: 'none', label: 'Sharp', previewClass: 'rounded-none' },
    { id: 'xl', label: 'Medium (16px)', previewClass: 'rounded-xl' },
    { id: '2xl', label: 'Smooth (24px)', previewClass: 'rounded-2xl' },
    { id: '3xl', label: 'Ultra (32px)', previewClass: 'rounded-3xl' },
  ];

  const tabs: { id: SettingsDrawerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'theme', label: 'Theme & Design', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'buttons', label: 'Buttons & Radius', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'general', label: 'General Settings', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'client', label: 'Client & Brand', icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dim Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-in Drawer Container */}
      <div
        className={`relative w-full max-w-xl sm:max-w-2xl h-full shadow-2xl flex flex-col z-10 border-l transition-transform duration-300 ease-out animate-slide-in-right ${
          systemTheme === 'light'
            ? 'bg-[#FFFFFF] border-slate-200 text-slate-900'
            : 'bg-[#18181B] border-zinc-800 text-zinc-100'
        }`}
      >
        {/* OpenAI-Style Drawer Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            systemTheme === 'light' ? 'border-slate-200 bg-white' : 'border-zinc-800 bg-[#18181B]'
          }`}
        >
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">Form Customization & Settings</h2>
            <p className="text-xs text-zinc-400">Configure appearance, typography, buttons, and metadata</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OpenAI Underline Tab Bar */}
        <div
          className={`px-6 flex items-center gap-6 border-b text-xs font-medium overflow-x-auto ${
            systemTheme === 'light' ? 'border-slate-200 bg-slate-50/50' : 'border-zinc-800 bg-[#18181B]'
          }`}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 flex items-center gap-1.5 whitespace-nowrap relative transition-colors ${
                  isActive
                    ? 'text-zinc-950 dark:text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950 dark:after:bg-white'
                    : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 1: THEME & DESIGN */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Presentation Presets
                </h3>
                <p className="text-xs text-zinc-400">
                  Select a complete design system for your form card, background, and inputs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(Object.entries(formThemes) as [FormTheme, FormThemeConfig][]).map(([key, config]) => {
                  const isSelected = formTheme === key;

                  return (
                    <div
                      key={key}
                      onClick={() => onChangeFormTheme(key)}
                      className={`group relative p-4 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                          : systemTheme === 'light'
                          ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{config.name}</h4>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                                Active
                              </span>
                            )}
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-zinc-600 bg-transparent text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
                          {config.description}
                        </p>
                      </div>

                      {/* Mini Live Preview */}
                      <div className={`p-2.5 rounded-xl ${config.preview.bgPreviewClass} border border-zinc-700/30 overflow-hidden`}>
                        <div className={`p-2.5 rounded-lg ${config.preview.cardPreviewClass} space-y-1.5`}>
                          <div className="h-1.5 w-1/2 bg-zinc-800 dark:bg-zinc-300 rounded" />
                          <div className="h-4 w-full rounded border border-zinc-300/80 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/80" />
                          <div className="flex justify-end pt-0.5">
                            <div
                              className="h-3 px-2 rounded-full text-[8px] font-bold text-white flex items-center"
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

              {/* Card Corner Radius */}
              {onChangeCardRadius && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Form Card Corner Radius
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {cardRadiusOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeCardRadius(opt.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                          cardRadius === opt.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 2: BUTTONS & RADIUS */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Button & Corner Styling
                </h3>
                <p className="text-xs text-zinc-400">
                  Customize button colors, text contrast, and border-radius.
                </p>
              </div>

              {/* Quick Brand Palettes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-all"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: preset.bg }}
                      />
                      <span className="text-zinc-800 dark:text-zinc-200">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Corner Radius */}
              {onChangeButtonRadius && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Button Corner Shape
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {buttonRadiusOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeButtonRadius(opt.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                          buttonRadius === opt.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Button Colors */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                    Primary Action (Next / Submit)
                  </h4>
                  <span
                    className={`px-3 py-1 text-xs font-bold shadow-xs ${
                      buttonRadius === 'full' ? 'rounded-full' : buttonRadius === 'none' ? 'rounded-none' : 'rounded-xl'
                    }`}
                    style={{
                      backgroundColor: primaryButtonColor,
                      color: primaryButtonTextColor,
                    }}
                  >
                    Next Step →
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonColor}
                        onChange={(e) => onChangePrimaryButtonColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={primaryButtonColor}
                        onChange={(e) => onChangePrimaryButtonColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonTextColor}
                        onChange={(e) => onChangePrimaryButtonTextColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={primaryButtonTextColor}
                        onChange={(e) => onChangePrimaryButtonTextColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Previous Button Colors */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Secondary Action (Previous)
                  </h4>
                  <span
                    className={`px-3 py-1 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 shadow-xs ${
                      buttonRadius === 'full' ? 'rounded-full' : buttonRadius === 'none' ? 'rounded-none' : 'rounded-xl'
                    }`}
                    style={{
                      backgroundColor: secondaryButtonColor,
                      color: secondaryButtonTextColor,
                    }}
                  >
                    ← Previous
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonColor}
                        onChange={(e) => onChangeSecondaryButtonColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={secondaryButtonColor}
                        onChange={(e) => onChangeSecondaryButtonColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonTextColor}
                        onChange={(e) => onChangeSecondaryButtonTextColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={secondaryButtonTextColor}
                        onChange={(e) => onChangeSecondaryButtonTextColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 3: GENERAL SETTINGS */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  General Form Configuration
                </h3>
                <p className="text-xs text-zinc-400">
                  Manage title, admin labels, and welcome messaging.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Form Title (Public)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => onChangeFormTitle(e.target.value)}
                  placeholder="e.g. Window & Door Estimator"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Internal Name (Admin Only)
                </label>
                <input
                  type="text"
                  value={internalName}
                  onChange={(e) => onChangeInternalName(e.target.value)}
                  placeholder="e.g. CompDoor Lead Form v2"
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Form Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => onChangeDescription(e.target.value)}
                  placeholder="Brief description of what this form accomplishes"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Welcome / Submission Message
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => onChangeWelcomeMessage(e.target.value)}
                  placeholder="Welcome or thank you message shown after completion"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* TAB 4: CLIENT & BRAND */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'client' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  Client & Brand Association
                </h3>
                <p className="text-xs text-zinc-400">
                  Attach this form to an organization to display logos and brand defaults.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Assigned Client
                </label>
                <select
                  value={clientId ?? ''}
                  onChange={(e) => onChangeClientId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Client Assigned (Generic)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {clientId && (
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center gap-4">
                  {clients.find((c) => c.id === clientId)?.logo_url ? (
                    <img
                      src={clients.find((c) => c.id === clientId)?.logo_url}
                      alt="Logo"
                      className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-zinc-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                      {clients.find((c) => c.id === clientId)?.name.charAt(0) || 'C'}
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-white">
                      {clients.find((c) => c.id === clientId)?.name}
                    </h4>
                    <p className="text-xs text-zinc-400">Client branding active for embed</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OpenAI Style Drawer Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            systemTheme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-[#18181B]'
          }`}
        >
          <div className="text-xs text-zinc-400">
            Active Theme: <span className="text-indigo-500 dark:text-indigo-400 font-semibold">{formThemes[formTheme]?.name || 'Modern Clean'}</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAndDone}
            disabled={isSavingInternal || isSaving}
            className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            {(isSavingInternal || isSaving) ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save & Done</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

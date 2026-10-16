import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface DevicePreviewToolbarProps {
  deviceMode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
  className?: string;
}

export const DevicePreviewToolbar: React.FC<DevicePreviewToolbarProps> = ({
  deviceMode,
  onChange,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg text-white ${className}`}>
      <button
        type="button"
        onClick={() => onChange('desktop')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          deviceMode === 'desktop'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Desktop View (100%)"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Desktop</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('tablet')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          deviceMode === 'tablet'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Tablet View (768px)"
      >
        <Tablet className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Tablet</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          deviceMode === 'mobile'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Mobile View (375px)"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mobile</span>
      </button>
    </div>
  );
};

import React from 'react';
import { Info, Upload, CheckCircle2, X } from 'lucide-react';
import { FormThemeConfig } from '../../lib/formThemes';

export interface ContactData {
  first_name?: string;
  last_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_postcode?: string;
  preferred_contact_method?: string;
  file?: File | { name: string; size?: number };
}

interface ModernFieldGroupProps {
  data: ContactData;
  onChange: (updated: Partial<ContactData>) => void;
  themeConfig: FormThemeConfig;
  primaryColor?: string;
  showPhone?: boolean;
  showAddress?: boolean;
  showPreferredContact?: boolean;
  showFileUpload?: boolean;
  onFileUpload?: (file: File) => void;
  onFileRemove?: () => void;
}

export const ModernFieldGroup: React.FC<ModernFieldGroupProps> = ({
  data,
  onChange,
  themeConfig,
  primaryColor,
  showPhone = true,
  showAddress = true,
  showPreferredContact = true,
  showFileUpload = true,
  onFileUpload,
  onFileRemove,
}) => {
  const firstName = data.contact_name ? data.contact_name.split(' ')[0] : (data.first_name || '');
  const lastName = data.contact_name ? data.contact_name.split(' ').slice(1).join(' ') : (data.last_name || '');

  const handleNameChange = (first: string, last: string) => {
    const fullName = `${first} ${last}`.trim();
    onChange({
      first_name: first,
      last_name: last,
      contact_name: fullName,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 2-Column Responsive First & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div>
          <label className={themeConfig.styles.text.label}>
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => handleNameChange(e.target.value, lastName)}
            placeholder="e.g. Sarah"
            required
            className={themeConfig.styles.input}
          />
        </div>

        <div>
          <label className={themeConfig.styles.text.label}>
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => handleNameChange(firstName, e.target.value)}
            placeholder="e.g. Connor"
            required
            className={themeConfig.styles.input}
          />
        </div>
      </div>

      {/* Email Address */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={themeConfig.styles.text.label}>
            Email Address <span className="text-rose-500">*</span>
          </label>
          <span className="text-xs text-slate-400">For quote confirmation</span>
        </div>
        <input
          type="email"
          value={data.contact_email || ''}
          onChange={(e) => onChange({ contact_email: e.target.value })}
          placeholder="sarah@example.com"
          required
          className={themeConfig.styles.input}
        />
      </div>

      {/* Phone Number */}
      {showPhone && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={themeConfig.styles.text.label}>
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1 text-xs text-slate-400" title="We only contact you regarding this request">
              <Info className="w-3.5 h-3.5" />
              <span>Direct contact only</span>
            </div>
          </div>
          <input
            type="tel"
            value={data.contact_phone || ''}
            onChange={(e) => onChange({ contact_phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            required
            className={themeConfig.styles.input}
          />
        </div>
      )}

      {/* Property Address / Postcode */}
      {showAddress && (
        <div>
          <label className={themeConfig.styles.text.label}>
            Property Address / Postcode
          </label>
          <input
            type="text"
            value={data.contact_postcode || ''}
            onChange={(e) => onChange({ contact_postcode: e.target.value })}
            placeholder="e.g. 123 High Street, London or Postal Code"
            className={themeConfig.styles.input}
          />
        </div>
      )}

      {/* Preferred Contact Method */}
      {showPreferredContact && (
        <div>
          <label className={themeConfig.styles.text.label}>
            Preferred Contact Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Phone Call', 'Email', 'Both'].map((method) => {
              const isSelected = (data.preferred_contact_method || 'Email') === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => onChange({ preferred_contact_method: method })}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  style={{
                    ...(isSelected && primaryColor ? { backgroundColor: primaryColor, borderColor: primaryColor } : {})
                  }}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* File Upload / Reference Images */}
      {showFileUpload && (
        <div className="pt-2">
          <label className={themeConfig.styles.text.label}>
            Attach Plans or Reference Photos <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>

          {data.file ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                  {data.file.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onFileRemove}
                className="p-1 text-emerald-700 hover:text-emerald-900 rounded-md hover:bg-emerald-100 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && onFileUpload) onFileUpload(file);
                };
                input.click();
              }}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                Click or drag & drop plans, photos, or architectural specs
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, PDF up to 10MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

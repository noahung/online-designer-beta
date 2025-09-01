/**
 * Form theme definitions for different presentation styles
 */

export type FormTheme = 'generic' | 'soft-ui';

export interface FormThemeConfig {
  name: string;
  description: string;
  preview: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  styles: {
    background: string;
    container: string;
    card: string;
    input: string;
    button: {
      primary: string;
      secondary: string;
    };
    text: {
      heading: string;
      body: string;
      label: string;
    };
    progress: string;
    decorations?: string;
  };
  fonts: string[];
}

export const formThemes: Record<FormTheme, FormThemeConfig> = {
  generic: {
    name: 'Generic',
    description: 'Clean and professional form design',
    preview: {
      primaryColor: 'bg-blue-500',
      secondaryColor: 'bg-gray-300',
      accentColor: 'bg-blue-600'
    },
    styles: {
      background: 'bg-slate-50',
      container: 'max-w-2xl mx-auto px-4 py-8',
      card: 'bg-white p-8 rounded-lg shadow-md border',
      input: 'w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      button: {
        primary: 'bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors',
        secondary: 'bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors'
      },
      text: {
        heading: 'text-2xl font-bold text-gray-900 mb-4',
        body: 'text-gray-600 mb-6',
        label: 'block text-sm font-medium text-gray-700 mb-2'
      },
      progress: 'w-full bg-gray-200 rounded-full h-2 overflow-hidden'
    },
    fonts: ['system-ui', 'sans-serif']
  },
  'soft-ui': {
    name: 'Soft UI',
    description: 'Modern glassmorphism design with elegant gradients',
    preview: {
      primaryColor: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      secondaryColor: 'bg-slate-300/60',
      accentColor: 'bg-purple-500'
    },
    styles: {
      background: 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden',
      container: 'max-w-2xl mx-auto px-4 py-8',
      card: 'glass-card rounded-3xl shadow-2xl p-10 border border-white/20',
      input: 'custom-input w-full px-6 py-4 rounded-2xl text-lg border-2 border-slate-200 transition-all duration-300 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:shadow-lg',
      button: {
        primary: 'custom-button text-white px-8 py-4 rounded-2xl font-semibold inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        secondary: 'bg-slate-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-slate-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2'
      },
      text: {
        heading: 'text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3',
        body: 'text-slate-600 mb-8 text-lg',
        label: 'block text-slate-700 font-semibold mb-3'
      },
      progress: 'w-full bg-slate-200 rounded-full h-3 overflow-hidden progress-glow',
      decorations: `
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>
      `
    },
    fonts: ['Inter', 'system-ui', 'sans-serif']
  }
};

export const softUIStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * {
    font-family: 'Inter', sans-serif;
  }
  
  .field-container {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .custom-input {
    border: 2px solid #f1f5f9;
    transition: all 0.3s ease;
    background: #fafafa;
  }
  
  .custom-input:focus {
    border-color: #6366f1;
    background: white;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .custom-button {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }
  
  .custom-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .progress-glow {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  
  .option-card {
    border: 2px solid #f1f5f9;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  }
  
  .option-card:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
  }
  
  .rating-btn {
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    font-weight: 600;
  }
  
  .rating-btn:hover {
    border-color: #6366f1;
    background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    transform: scale(1.05);
  }
  
  .rating-btn.selected {
    border-color: #6366f1;
    background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }
  
  .star-rating {
    cursor: pointer;
    transition: all 0.2s ease;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  }
  
  .star-rating:hover {
    transform: scale(1.15);
  }
`;

export function getThemeConfig(theme: FormTheme): FormThemeConfig {
  return formThemes[theme] || formThemes.generic;
}

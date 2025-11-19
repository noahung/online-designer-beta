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
  container: 'w-full px-4 py-8 flex justify-center',
  card: 'bg-white p-8 rounded-lg shadow-md border w-full',
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
    description: 'Apple-inspired glassmorphism with refined transparency and depth',
    preview: {
      primaryColor: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
      secondaryColor: 'bg-white/40',
      accentColor: 'bg-blue-600'
    },
    styles: {
      background: 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 relative',
  container: 'w-full px-4 py-8 relative z-10 flex justify-center',
  card: 'apple-glass-card rounded-3xl shadow-2xl p-10 border border-white/30 w-full',
      input: 'apple-input w-full px-5 py-4 rounded-2xl border border-white/20 transition-all duration-300 bg-white/60 focus:border-blue-400/60 focus:bg-white/80 backdrop-blur-xl',
      button: {
        primary: 'apple-button text-white px-8 py-4 rounded-full font-medium inline-flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl backdrop-blur-sm',
        secondary: 'apple-button-secondary bg-white/60 backdrop-blur-xl text-slate-700 px-8 py-4 rounded-full font-medium hover:bg-white/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3 border border-white/30'
      },
      text: {
        heading: 'text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4 tracking-tight',
        body: 'text-slate-600/80 mb-8 text-lg leading-relaxed',
        label: 'block text-slate-700/90 font-semibold mb-3 text-base tracking-wide'
      },
      progress: 'w-full bg-white/40 backdrop-blur-sm rounded-full h-2 overflow-hidden apple-progress shadow-inner',
      decorations: `
        <div class="apple-decorations absolute inset-0 overflow-hidden pointer-events-none" style="height: fit-content;">
          <div class="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-500/15 rounded-full blur-2xl animate-pulse"></div>
          <div class="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-indigo-400/10 to-pink-500/15 rounded-full blur-2xl animate-pulse" style="animation-delay: 1s;"></div>
          <div class="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-cyan-300/5 to-blue-400/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 2s;"></div>
        </div>
      `
    },
    fonts: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif']
  }
};

export const softUIStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * {
    font-family: 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  .field-container {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  
  .apple-input {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 8px 25px rgba(0, 0, 0, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  .apple-input:focus {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 
      0 0 0 4px rgba(59, 130, 246, 0.08),
      0 4px 20px rgba(59, 130, 246, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    outline: none;
  }
  
  .apple-input::placeholder {
    color: rgba(100, 116, 139, 0.6);
    font-weight: 400;
  }
  
  .apple-button {
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.15),
      0 8px 30px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-weight: 600;
    letter-spacing: 0.025em;
  }
  
  .apple-button:hover {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.2),
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  .apple-button:active {
    transform: translateY(0) scale(0.98);
    transition-duration: 0.1s;
  }
  
  .apple-button-secondary {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.08),
      0 8px 25px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.3);
    font-weight: 600;
    letter-spacing: 0.025em;
  }
  
  .apple-button-secondary:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px) scale(1.02);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.1),
      0 12px 40px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  
  .apple-glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(25px) saturate(200%);
    -webkit-backdrop-filter: blur(25px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
      0 8px 40px rgba(0, 0, 0, 0.12),
      0 20px 60px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 0 0 1px rgba(255, 255, 255, 0.3);
    position: relative;
  }
  
  .apple-glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
  
  .apple-progress {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .apple-progress .progress-bar {
    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);
    background-size: 200% 100%;
    animation: shimmer 2s ease-in-out infinite;
    box-shadow: 
      0 0 15px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  @keyframes shimmer {
    0%, 100% { background-position: 0% 0%; }
    50% { background-position: 100% 0%; }
  }
  
  .apple-decorations {
    animation: float 8s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(-10px, -15px) rotate(1deg); }
    66% { transform: translate(10px, -10px) rotate(-1deg); }
  }
  
  .option-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(15px) saturate(180%);
    -webkit-backdrop-filter: blur(15px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.06),
      0 8px 25px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  .option-card:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 
      0 8px 30px rgba(59, 130, 246, 0.15),
      0 15px 50px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
  
  .rating-btn {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(15px) saturate(180%);
    -webkit-backdrop-filter: blur(15px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-weight: 600;
    letter-spacing: 0.025em;
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  .rating-btn:hover {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-color: rgba(59, 130, 246, 0.6);
    color: white;
    transform: scale(1.05) translateY(-1px);
    box-shadow: 
      0 4px 15px rgba(59, 130, 246, 0.3),
      0 8px 30px rgba(59, 130, 246, 0.2);
  }
  
  .rating-btn.selected {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-color: rgba(59, 130, 246, 0.6);
    color: white;
    box-shadow: 
      0 4px 15px rgba(59, 130, 246, 0.35),
      0 8px 30px rgba(59, 130, 246, 0.25);
  }
  
  .star-rating {
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
  }
  
  .star-rating:hover {
    transform: scale(1.2) translateY(-1px);
    filter: drop-shadow(0 4px 12px rgba(251, 191, 36, 0.4));
  }
  
  /* Enhanced text styling for Apple feel */
  h1, h2, h3 {
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.2;
  }
  
  p, span, label {
    font-weight: 400;
    line-height: 1.5;
  }
  
  /* Smooth scroll behavior */
  * {
    scroll-behavior: smooth;
  }
  
  /* Enhanced focus styles */
  *:focus-visible {
    outline: 2px solid rgba(59, 130, 246, 0.6);
    outline-offset: 2px;
  }
  
  /* Legacy support for existing classes */
  .custom-input {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 8px 25px rgba(0, 0, 0, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  
  .custom-input:focus {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 
      0 0 0 4px rgba(59, 130, 246, 0.08),
      0 4px 20px rgba(59, 130, 246, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    outline: none;
  }
  
  .custom-button {
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.15),
      0 8px 30px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-weight: 600;
    letter-spacing: 0.025em;
  }
  
  .custom-button:hover {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.2),
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(25px) saturate(200%);
    -webkit-backdrop-filter: blur(25px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 
      0 8px 40px rgba(0, 0, 0, 0.12),
      0 20px 60px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    position: relative;
  }
  
  .glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
  
  .progress-glow {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px) saturate(150%);
    -webkit-backdrop-filter: blur(10px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .progress-glow .progress-bar {
    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%);
    background-size: 200% 100%;
    animation: shimmer 2s ease-in-out infinite;
    box-shadow: 
      0 0 15px rgba(59, 130, 246, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

export function getThemeConfig(theme: FormTheme): FormThemeConfig {
  return formThemes[theme] || formThemes.generic;
}

/**
 * Theme utility library for consistent styling across the application
 * Centralizes theme-aware class generation to reduce repetition
 */

export type ThemeMode = 'light' | 'dark';

/**
 * Background variants for different component types
 * Shifted to highly translucent glass values to let mesh gradients shine through
 */
export const backgrounds = {
  card: (theme: ThemeMode) => 
    theme === 'light' 
      ? 'bg-white/40 border-white/20 backdrop-blur-xl shadow-lg' 
      : 'bg-black/40 border-white/10 backdrop-blur-xl shadow-lg',
  
  modal: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white/40 border-white/25 backdrop-blur-2xl shadow-2xl'
      : 'bg-black/40 border-white/10 backdrop-blur-2xl shadow-2xl',
  
  sidebar: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white/30 border-white/20 backdrop-blur-xl'
      : 'bg-black/30 border-white/10 backdrop-blur-xl',
  
  input: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white/10 border-white/20 text-slate-800 placeholder-slate-500 focus:ring-2 focus:ring-indigo-400/50 focus:border-transparent'
      : 'bg-black/10 border-white/10 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent',
  
  dropdown: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white/40 border-white/20 text-slate-800 backdrop-blur-xl'
      : 'bg-black/40 border-white/10 text-slate-100 backdrop-blur-xl'
} as const;

/**
 * Border utilities for consistent styling
 */
export const borders = {
  default: (theme: ThemeMode) =>
    theme === 'light' ? 'border-white/20' : 'border-white/10',
  
  input: (theme: ThemeMode) =>
    theme === 'light' ? 'border-white/20' : 'border-white/10'
} as const;

/**
 * Text color variants for different semantic meanings
 * Softened text colors to slate scales to avoid harsh absolute contrast
 */
export const textColors = {
  primary: (theme: ThemeMode) =>
    theme === 'light' ? 'text-slate-800' : 'text-slate-100',
  
  secondary: (theme: ThemeMode) =>
    theme === 'light' ? 'text-slate-600' : 'text-slate-300',
  
  muted: (theme: ThemeMode) =>
    theme === 'light' ? 'text-slate-500' : 'text-slate-400',
  
  label: (theme: ThemeMode) =>
    theme === 'light' ? 'text-slate-700' : 'text-slate-200',
  
  error: (theme: ThemeMode) =>
    theme === 'light' ? 'text-red-600' : 'text-red-400',
  
  success: (theme: ThemeMode) =>
    theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'
} as const;

/**
 * Gradient variants for headings and special text
 * Upgraded to premium, luminous, AI-inspired palettes
 */
export const gradients = {
  heading: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500'
      : 'bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400',
  
  logo: (theme: ThemeMode) =>
    theme === 'light'
      ? 'from-indigo-500 to-cyan-500'
      : 'from-blue-400 to-fuchsia-400',
  
  title: (theme: ThemeMode) =>
    theme === 'light'
      ? 'from-indigo-600 to-purple-600'
      : 'from-blue-400 to-violet-400',
  
  button: (theme: ThemeMode) =>
    theme === 'light'
      ? 'from-indigo-400 via-purple-400 to-cyan-400 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500'
      : 'from-blue-600 via-violet-600 to-fuchsia-600 hover:from-blue-700 hover:via-violet-700 hover:to-fuchsia-700'
} as const;

/**
 * Button variants for consistent styling
 * Pill shapes with scaling, outer shadows, and buttery transition timings
 */
export const buttons = {
  primary: (theme: ThemeMode) =>
    theme === 'light'
      ? 'px-6 py-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
      : 'px-6 py-3 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 hover:from-blue-700 hover:via-violet-700 hover:to-fuchsia-700 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]',
  
  secondary: (theme: ThemeMode) =>
    theme === 'light'
      ? 'px-6 py-3 bg-white/20 text-slate-800 hover:bg-white/30 rounded-full font-medium transition-all duration-300 ease-out border border-white/25 hover:scale-[1.02]'
      : 'px-6 py-3 bg-white/10 text-white/90 hover:bg-white/20 rounded-full font-medium transition-all duration-300 ease-out border border-white/10 hover:scale-[1.02]',
  
  danger: (theme: ThemeMode) =>
    theme === 'light'
      ? 'px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02]'
      : 'px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02]',
  
  ghost: (theme: ThemeMode) =>
    theme === 'light'
      ? 'p-2 text-slate-600 hover:text-slate-800 hover:bg-white/30 rounded-full transition-all duration-300 ease-out'
      : 'p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 ease-out'
} as const;

/**
 * Layout variants for consistent spacing and structure
 * Shifted to clean transparency since the animated mesh backdrop handles the background canvas
 */
export const layout = {
  page: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-transparent'
      : 'bg-transparent',
  
  container: 'p-8 animate-fade-in',
  
  backdrop: (theme: ThemeMode) =>
    theme === 'light' ? 'bg-black/10 backdrop-blur-md' : 'bg-black/40 backdrop-blur-md'
} as const;

/**
 * Animation delays for staggered animations
 */
export const animations = {
  stagger: (index: number) => `${index * 0.1}s`,
  sequence: ['0.1s', '0.2s', '0.3s', '0.4s', '0.5s'],
  fadeIn: () => 'animate-fade-in',
  slideIn: () => 'animate-slide-in-up',
  hover: () => 'hover:scale-[1.02] transition-transform duration-300 ease-out',
  spin: () => 'animate-spin'
} as const;

/**
 * Utility function to combine multiple theme classes
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate navigation item classes based on active state (pill aesthetic)
 */
export const navigationItem = (theme: ThemeMode, isActive: boolean) => cn(
  'group flex items-center px-4 py-3.5 text-sm font-medium rounded-full transition-all duration-300 animate-fade-in',
  isActive 
    ? theme === 'light'
      ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-700 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 transform scale-[1.02]'
      : 'bg-gradient-to-r from-blue-500/20 to-fuchsia-600/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20 transform scale-[1.02]'
    : theme === 'light'
      ? 'text-slate-600 hover:text-slate-800 hover:bg-white/20 hover:scale-[1.02]'
      : 'text-slate-300 hover:text-white hover:bg-white/10 hover:scale-[1.02]'
);

/**
 * Generate loading skeleton classes
 */
export const loadingSkeleton = (theme: ThemeMode, className?: string) => cn(
  'animate-pulse',
  theme === 'light' ? 'bg-slate-200' : 'bg-white/10',
  className
);

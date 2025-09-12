/**
 * Theme utility func  input: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
      : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-blue-400 focus:border-transparent',
  
  select: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white border-gray-300 text-gray-900'
      : 'bg-white/10 border-white/20 text-white',
  
  border: (theme: ThemeMode) =>
    theme === 'light' ? 'border-gray-200' : 'border-white/10'
} as const;

/**
 * Border utilities for consistent styling
 */
export const borders = {
  default: (theme: ThemeMode) =>
    theme === 'light' ? 'border-gray-200' : 'border-white/10',
  
  input: (theme: ThemeMode) =>
    theme === 'light' ? 'border-gray-300' : 'border-white/20'
} as const;

/**
 * Theme utility library for consistent styling across the application
 * Centralizes theme-aware class generation to reduce repetition
 */

export type ThemeMode = 'light' | 'dark';

/**
 * Background variants for different component types
 */
export const backgrounds = {
  card: (theme: ThemeMode) => 
    theme === 'light' 
      ? 'bg-white/80 border-gray-200 shadow-lg' 
      : 'bg-white/10 border-white/20',
  
  modal: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white/95 border-gray-200'
      : 'bg-white/10 border-white/20',
  
  sidebar: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white/80 border-gray-200'
      : 'bg-white/10 border-white/20',
  
  input: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
      : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-blue-400 focus:border-transparent',
  
  dropdown: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-white border-gray-300 text-gray-900'
      : 'bg-white/10 border-white/20 text-white'
} as const;

/**
 * Text color variants for different semantic meanings
 */
export const textColors = {
  primary: (theme: ThemeMode) =>
    theme === 'light' ? 'text-gray-900' : 'text-white',
  
  secondary: (theme: ThemeMode) =>
    theme === 'light' ? 'text-gray-600' : 'text-white/70',
  
  muted: (theme: ThemeMode) =>
    theme === 'light' ? 'text-gray-500' : 'text-white/60',
  
  label: (theme: ThemeMode) =>
    theme === 'light' ? 'text-gray-700' : 'text-white/90',
  
  error: (theme: ThemeMode) =>
    theme === 'light' ? 'text-red-600' : 'text-red-400',
  
  success: (theme: ThemeMode) =>
    theme === 'light' ? 'text-green-600' : 'text-green-400'
} as const;

/**
 * Gradient variants for headings and special text
 */
export const gradients = {
  heading: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-gradient-to-r from-gray-900 via-orange-600 to-red-600'
      : 'bg-gradient-to-r from-white via-orange-100 to-red-200',
  
  logo: (theme: ThemeMode) =>
    theme === 'light'
      ? 'from-gray-800 to-orange-600'
      : 'from-white to-orange-200',
  
  title: (theme: ThemeMode) =>
    theme === 'light'
      ? 'from-gray-800 to-blue-600'
      : 'from-white to-blue-200',
  
  button: (theme: ThemeMode) =>
    theme === 'light'
      ? 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
      : 'from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30'
} as const;

/**
 * Button variants for consistent styling
 */
export const buttons = {
  primary: (theme: ThemeMode) =>
    'px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105',
  
  secondary: (theme: ThemeMode) =>
    theme === 'light'
      ? 'px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200'
      : 'px-6 py-3 bg-white/10 text-white/90 hover:bg-white/20 rounded-xl font-medium transition-all duration-200',
  
  danger: (theme: ThemeMode) =>
    'px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105',
  
  ghost: (theme: ThemeMode) =>
    theme === 'light'
      ? 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200'
      : 'p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200'
} as const;

/**
 * Layout variants for consistent spacing and structure
 */
export const layout = {
  page: (theme: ThemeMode) =>
    theme === 'light'
      ? 'bg-gradient-to-br from-gray-50 via-orange-50 to-gray-50'
      : 'bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900',
  
  container: 'p-8 animate-fade-in',
  
  backdrop: (theme: ThemeMode) =>
    theme === 'light' ? 'bg-black/30' : 'bg-black/75'
} as const;

/**
 * Animation delays for staggered animations
 */
export const animations = {
  stagger: (index: number) => `${index * 0.1}s`,
  sequence: ['0.1s', '0.2s', '0.3s', '0.4s', '0.5s'],
  fadeIn: () => 'animate-fade-in',
  slideIn: () => 'animate-slide-in-up',
  hover: () => 'hover:scale-105 transition-transform duration-200',
  spin: () => 'animate-spin'
} as const;

/**
 * Utility function to combine multiple theme classes
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate navigation item classes based on active state
 */
export const navigationItem = (theme: ThemeMode, isActive: boolean) => cn(
  'group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 animate-fade-in',
  isActive 
    ? theme === 'light'
      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-gray-900 border border-blue-400/30 shadow-lg shadow-blue-500/25 transform scale-105'
      : 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-400/30 shadow-lg shadow-blue-500/25 transform scale-105'
    : theme === 'light'
      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105'
      : 'text-white/70 hover:text-white hover:bg-white/10 hover:scale-105'
);

/**
 * Generate loading skeleton classes
 */
export const loadingSkeleton = (theme: ThemeMode, className?: string) => cn(
  'animate-pulse',
  theme === 'light' ? 'bg-gray-200' : 'bg-white/20',
  className
);

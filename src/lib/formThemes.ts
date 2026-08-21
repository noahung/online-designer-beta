/**
 * Form theme definitions for different presentation styles
 * Inspired by BetterStack, Linear, Apple Glassmorphism, Typeform, and modern SaaS
 */

export type FormTheme = 'generic' | 'soft-ui' | 'midnight-slate' | 'warm-editorial' | 'vibrant-neo';

export interface FormThemeConfig {
  id: FormTheme;
  name: string;
  subtitle: string;
  description: string;
  preview: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    bgPreviewClass: string;
    cardPreviewClass: string;
    textColor: string;
  };
  styles: {
    background: string;
    backgroundStyle?: React.CSSProperties;
    container: string;
    card: string;
    input: string;
    inputWrapper?: string;
    button: {
      primary: string;
      secondary: string;
      skip?: string;
    };
    text: {
      heading: string;
      subheading?: string;
      body: string;
      label: string;
      helper: string;
    };
    progress: {
      track: string;
      bar: string;
      stepperDotActive: string;
      stepperDotCompleted: string;
      stepperDotInactive: string;
      stepperLineActive: string;
      stepperLineInactive: string;
    };
    choiceCard: {
      base: string;
      selected: string;
      hover: string;
      imageWrap: string;
      badge: string;
    };
    ratingBtn: {
      base: string;
      selected: string;
      hover: string;
    };
    decorations?: string;
  };
  fonts: {
    heading: string;
    body: string;
    googleFontUrl?: string;
  };
}

export const formThemes: Record<FormTheme, FormThemeConfig> = {
  generic: {
    id: 'generic',
    name: 'Modern Clean',
    subtitle: 'BetterStack & Inter inspired',
    description: 'Crisp layout, refined borders, high-contrast typography, and intuitive focus rings.',
    preview: {
      primaryColor: '#4F46E5', // Indigo-600
      secondaryColor: '#F1F5F9',
      accentColor: '#6366F1',
      bgPreviewClass: 'bg-slate-50',
      cardPreviewClass: 'bg-white border border-slate-200 shadow-md',
      textColor: 'text-slate-900'
    },
    styles: {
      background: 'bg-slate-50 text-slate-900 min-h-screen relative font-sans',
      container: 'w-full px-4 py-8 sm:py-12 flex justify-center items-start min-h-screen',
      card: 'bg-white shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-10 w-full max-w-2xl transition-all duration-300',
      input: 'w-full px-4 py-3.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all duration-200 text-base',
      button: {
        primary: 'w-full sm:w-auto px-7 py-3.5 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
        secondary: 'w-full sm:w-auto px-6 py-3.5 text-slate-700 font-medium transition-all duration-200 border border-slate-200 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
        skip: 'text-sm text-slate-500 hover:text-slate-800 transition-colors py-2'
      },
      text: {
        heading: 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2',
        subheading: 'text-sm sm:text-base font-normal text-slate-500 mb-6',
        body: 'text-slate-600 mb-6 text-base',
        label: 'block text-sm font-semibold text-slate-700 mb-2 tracking-normal',
        helper: 'text-xs text-slate-400 mt-1.5'
      },
      progress: {
        track: 'w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60',
        bar: 'h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out',
        stepperDotActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-4 ring-indigo-100',
        stepperDotCompleted: 'bg-emerald-600 text-white',
        stepperDotInactive: 'bg-slate-100 text-slate-500 border border-slate-300',
        stepperLineActive: 'bg-indigo-600',
        stepperLineInactive: 'bg-slate-200'
      },
      choiceCard: {
        base: 'border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-white text-left transition-all duration-200 ease-out flex flex-col h-full hover:border-slate-300 hover:shadow-md cursor-pointer relative overflow-hidden group',
        selected: 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/20 shadow-md shadow-indigo-500/10',
        hover: 'hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-lg',
        imageWrap: 'rounded-xl overflow-hidden bg-slate-100 mb-3.5',
        badge: 'w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm'
      },
      ratingBtn: {
        base: 'border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl transition-all duration-200 font-semibold',
        selected: 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/25',
        hover: 'hover:border-indigo-400'
      }
    },
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
    }
  },

  'soft-ui': {
    id: 'soft-ui',
    name: 'Soft Glassmorphism',
    subtitle: 'Apple-inspired Frosted Glass',
    description: 'Specular highlights, multi-layer blur, ambient floating lights, and smooth tactile buttons.',
    preview: {
      primaryColor: '#4F46E5',
      secondaryColor: 'rgba(255, 255, 255, 0.7)',
      accentColor: '#8B5CF6',
      bgPreviewClass: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
      cardPreviewClass: 'bg-white/50 backdrop-blur-xl border border-white/70 shadow-xl',
      textColor: 'text-slate-800'
    },
    styles: {
      background: 'apple-bg min-h-screen relative overflow-hidden font-sans',
      container: 'w-full px-4 py-8 sm:py-12 flex justify-center items-start min-h-screen relative z-10',
      card: 'apple-glass-card shadow-2xl p-6 sm:p-10 w-full max-w-2xl transition-all duration-300 relative',
      input: 'apple-input w-full px-5 py-4 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-300 text-base',
      button: {
        primary: 'apple-button w-full sm:w-auto text-white px-8 py-4 font-semibold inline-flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer active:scale-[0.99]',
        secondary: 'apple-button-secondary w-full sm:w-auto text-slate-700 px-7 py-4 font-semibold transition-all duration-300 inline-flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-[0.99]',
        skip: 'text-sm text-slate-500 hover:text-slate-800 transition-colors py-2'
      },
      text: {
        heading: 'text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight',
        subheading: 'text-sm sm:text-base font-medium text-slate-600 mb-6',
        body: 'text-slate-600 mb-6 text-base leading-relaxed',
        label: 'block text-slate-700 font-semibold mb-2 text-sm tracking-wide',
        helper: 'text-xs text-slate-400 mt-1.5'
      },
      progress: {
        track: 'w-full bg-white/50 backdrop-blur-md rounded-full h-2.5 overflow-hidden shadow-inner border border-white/60',
        bar: 'h-full bg-indigo-600 rounded-full transition-all duration-500',
        stepperDotActive: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-white/80',
        stepperDotCompleted: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
        stepperDotInactive: 'bg-white/70 text-slate-600 border border-white/80 backdrop-blur-md',
        stepperLineActive: 'bg-indigo-600',
        stepperLineInactive: 'bg-white/60'
      },
      choiceCard: {
        base: 'option-glass-card rounded-2xl p-4 sm:p-5 text-left transition-all duration-300 ease-out flex flex-col h-full cursor-pointer relative overflow-hidden group',
        selected: 'ring-2 ring-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20',
        hover: 'hover:-translate-y-1 hover:shadow-xl',
        imageWrap: 'rounded-xl overflow-hidden bg-white/40 mb-3.5 backdrop-blur-sm',
        badge: 'w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md'
      },
      ratingBtn: {
        base: 'rating-glass-btn bg-white/60 border border-white/70 backdrop-blur-md hover:bg-white/90 text-slate-800 rounded-2xl transition-all duration-300 font-semibold',
        selected: 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/30',
        hover: 'hover:border-indigo-400'
      },
      decorations: `
        <div class="apple-decorations-ambient fixed inset-0 overflow-hidden pointer-events-none z-0" style="min-height: 100vh;">
          <div class="apple-orb orb-1"></div>
          <div class="apple-orb orb-2"></div>
          <div class="apple-orb orb-3"></div>
        </div>
      `
    },
    fonts: {
      heading: "system-ui, -apple-system, 'SF Pro Display', 'Inter', sans-serif",
      body: "system-ui, -apple-system, 'SF Pro Text', 'Inter', sans-serif",
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
    }
  },

  'midnight-slate': {
    id: 'midnight-slate',
    name: 'Midnight Dark',
    subtitle: 'Linear & Vercel inspired',
    description: 'High-contrast obsidian dark mode with subtle glowing accents and sleek dark inputs.',
    preview: {
      primaryColor: '#6366F1',
      secondaryColor: '#1E293B',
      accentColor: '#38BDF8',
      bgPreviewClass: 'bg-slate-950',
      cardPreviewClass: 'bg-slate-900 border border-slate-800 shadow-xl',
      textColor: 'text-white'
    },
    styles: {
      background: 'bg-[#0B0F17] text-slate-100 min-h-screen relative font-sans',
      container: 'w-full px-4 py-8 sm:py-12 flex justify-center items-start min-h-screen',
      card: 'bg-[#111726] shadow-2xl shadow-black/80 border border-slate-800/90 p-6 sm:p-10 w-full max-w-2xl transition-all duration-300 relative',
      input: 'w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-base',
      button: {
        primary: 'w-full sm:w-auto px-7 py-3.5 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/30 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
        secondary: 'w-full sm:w-auto px-6 py-3.5 text-slate-300 font-medium transition-all duration-200 border border-slate-700 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
        skip: 'text-sm text-slate-400 hover:text-white transition-colors py-2'
      },
      text: {
        heading: 'text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2',
        subheading: 'text-sm sm:text-base font-normal text-slate-400 mb-6',
        body: 'text-slate-300 mb-6 text-base',
        label: 'block text-sm font-semibold text-slate-200 mb-2',
        helper: 'text-xs text-slate-500 mt-1.5'
      },
      progress: {
        track: 'w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60',
        bar: 'h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out',
        stepperDotActive: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/20',
        stepperDotCompleted: 'bg-emerald-500 text-white',
        stepperDotInactive: 'bg-slate-800 text-slate-400 border border-slate-700',
        stepperLineActive: 'bg-indigo-500',
        stepperLineInactive: 'bg-slate-800'
      },
      choiceCard: {
        base: 'border border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-900/90 text-left transition-all duration-200 ease-out flex flex-col h-full hover:border-slate-700 hover:bg-slate-850 cursor-pointer relative overflow-hidden group',
        selected: 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/20',
        hover: 'hover:border-indigo-400/60 hover:-translate-y-0.5',
        imageWrap: 'rounded-xl overflow-hidden bg-slate-800 mb-3.5',
        badge: 'w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-md'
      },
      ratingBtn: {
        base: 'border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl transition-all duration-200 font-semibold',
        selected: 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30',
        hover: 'hover:border-indigo-500'
      }
    },
    fonts: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
    }
  },

  'warm-editorial': {
    id: 'warm-editorial',
    name: 'Warm Editorial',
    subtitle: 'Classic serif typography & luxe stone',
    description: 'Luxe editorial aesthetic with warm paper backgrounds, refined stone borders, and serif titles.',
    preview: {
      primaryColor: '#292524',
      secondaryColor: '#E7E5E4',
      accentColor: '#D97706',
      bgPreviewClass: 'bg-[#FAF7F2]',
      cardPreviewClass: 'bg-[#FFFDF9] border border-stone-300 shadow-md',
      textColor: 'text-stone-900'
    },
    styles: {
      background: 'bg-[#FAF7F2] text-stone-900 min-h-screen relative font-serif',
      container: 'w-full px-4 py-8 sm:py-12 flex justify-center items-start min-h-screen',
      card: 'bg-[#FFFDF9] shadow-xl shadow-stone-300/40 border border-stone-200 p-6 sm:p-10 w-full max-w-2xl transition-all duration-300',
      input: 'w-full px-4 py-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-400/20 focus:border-stone-800 transition-all duration-200 text-base font-sans',
      button: {
        primary: 'w-full sm:w-auto px-7 py-3.5 text-stone-50 font-semibold transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 cursor-pointer font-sans active:scale-[0.99]',
        secondary: 'w-full sm:w-auto px-6 py-3.5 text-stone-700 font-medium transition-all duration-200 border border-stone-300 inline-flex items-center justify-center gap-2 cursor-pointer font-sans active:scale-[0.99]',
        skip: 'text-sm text-stone-500 hover:text-stone-800 transition-colors py-2 font-sans'
      },
      text: {
        heading: 'text-2xl sm:text-3xl font-serif font-bold tracking-normal text-stone-900 mb-2',
        subheading: 'text-sm sm:text-base font-sans text-stone-600 mb-6',
        body: 'text-stone-700 mb-6 text-base font-sans',
        label: 'block text-sm font-sans font-semibold text-stone-800 mb-2',
        helper: 'text-xs font-sans text-stone-500 mt-1.5'
      },
      progress: {
        track: 'w-full bg-stone-200 rounded-full h-2 overflow-hidden',
        bar: 'h-full bg-stone-800 rounded-full transition-all duration-500 ease-out',
        stepperDotActive: 'bg-stone-900 text-stone-50 shadow-md ring-4 ring-stone-200',
        stepperDotCompleted: 'bg-emerald-700 text-white',
        stepperDotInactive: 'bg-stone-100 text-stone-600 border border-stone-300',
        stepperLineActive: 'bg-stone-900',
        stepperLineInactive: 'bg-stone-200'
      },
      choiceCard: {
        base: 'border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white text-left transition-all duration-200 ease-out flex flex-col h-full hover:border-stone-400 hover:shadow-md cursor-pointer relative overflow-hidden group font-sans',
        selected: 'ring-2 ring-stone-800 border-stone-800 bg-stone-50 shadow-md',
        hover: 'hover:border-stone-500 hover:-translate-y-0.5',
        imageWrap: 'rounded-xl overflow-hidden bg-stone-100 mb-3.5',
        badge: 'w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center'
      },
      ratingBtn: {
        base: 'border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-900 rounded-xl transition-all duration-200 font-semibold font-sans',
        selected: 'bg-stone-900 border-stone-900 text-white shadow-md',
        hover: 'hover:border-stone-600'
      }
    },
    fonts: {
      heading: "'Playfair Display', Georgia, serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
    }
  },

  'vibrant-neo': {
    id: 'vibrant-neo',
    name: 'Vibrant Neo',
    subtitle: 'Dynamic SaaS gradients & micro-interactions',
    description: 'High energy look with subtle vibrant pink/purple glows, rounded pill badges, and friendly typography.',
    preview: {
      primaryColor: '#7C3AED',
      secondaryColor: '#FAF5FF',
      accentColor: '#EC4899',
      bgPreviewClass: 'bg-gradient-to-br from-violet-50 to-pink-50',
      cardPreviewClass: 'bg-white border border-purple-200 shadow-xl shadow-purple-500/10',
      textColor: 'text-slate-900'
    },
    styles: {
      background: 'bg-gradient-to-br from-violet-50 via-pink-50/50 to-amber-50/50 text-slate-900 min-h-screen relative font-sans',
      container: 'w-full px-4 py-8 sm:py-12 flex justify-center items-start min-h-screen',
      card: 'bg-white shadow-2xl shadow-purple-500/10 border border-purple-100 p-6 sm:p-10 w-full max-w-2xl transition-all duration-300',
      input: 'w-full px-5 py-4 bg-purple-50/40 border border-purple-200/80 rounded-2xl text-slate-900 placeholder-purple-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-600 transition-all duration-200 text-base',
      button: {
        primary: 'w-full sm:w-auto px-8 py-4 text-white font-bold transition-all duration-200 shadow-lg shadow-purple-500/25 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
        secondary: 'w-full sm:w-auto px-7 py-4 text-purple-900 font-semibold transition-all duration-200 border border-purple-200 inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]',
        skip: 'text-sm text-purple-600 hover:text-purple-900 transition-colors py-2'
      },
      text: {
        heading: 'text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight',
        subheading: 'text-sm sm:text-base font-medium text-slate-600 mb-6',
        body: 'text-slate-600 mb-6 text-base',
        label: 'block text-sm font-bold text-slate-800 mb-2',
        helper: 'text-xs text-slate-400 mt-1.5'
      },
      progress: {
        track: 'w-full bg-purple-100/80 rounded-full h-2.5 overflow-hidden',
        bar: 'h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all duration-500 ease-out',
        stepperDotActive: 'bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-100',
        stepperDotCompleted: 'bg-emerald-500 text-white',
        stepperDotInactive: 'bg-purple-50 text-purple-600 border border-purple-200',
        stepperLineActive: 'bg-gradient-to-r from-violet-600 to-pink-500',
        stepperLineInactive: 'bg-purple-100'
      },
      choiceCard: {
        base: 'border-2 border-purple-100/80 rounded-3xl p-4 sm:p-5 bg-white text-left transition-all duration-200 ease-out flex flex-col h-full hover:border-purple-300 hover:shadow-xl cursor-pointer relative overflow-hidden group',
        selected: 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/40 shadow-xl shadow-purple-500/15',
        hover: 'hover:border-purple-400 hover:-translate-y-1',
        imageWrap: 'rounded-2xl overflow-hidden bg-purple-50 mb-3.5',
        badge: 'w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-white text-xs font-bold flex items-center justify-center shadow-md'
      },
      ratingBtn: {
        base: 'border-2 border-purple-100 bg-purple-50/50 hover:bg-purple-100 text-purple-900 rounded-2xl transition-all duration-200 font-bold',
        selected: 'bg-gradient-to-r from-pink-500 to-purple-600 border-transparent text-white shadow-lg shadow-pink-500/25',
        hover: 'hover:border-pink-400'
      }
    },
    fonts: {
      heading: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
    }
  }
};

export interface FormDesignMeta {
  theme?: FormTheme;
  buttonRadius?: string;
  cardRadius?: string;
  headingColor?: string;
  descriptionColor?: string;
}

/**
 * Extracts design metadata (theme, button radius, card radius, headingColor, descriptionColor) seamlessly from description or formTheme
 */
export function extractDesignMeta(
  description?: string | null,
  formTheme?: string | null
): {
  theme: FormTheme;
  buttonRadius: string;
  cardRadius: string;
  headingColor?: string;
  descriptionColor?: string;
  cleanDescription: string;
} {
  let theme: FormTheme = 'generic';
  let buttonRadius = 'xl';
  let cardRadius = '2xl';
  let headingColor: string | undefined = undefined;
  let descriptionColor: string | undefined = undefined;
  let cleanDescription = description || '';

  // 1. Check metadata embedded in description: <!--style:{...}-->
  if (description && description.includes('<!--style:')) {
    try {
      const match = description.match(/<!--style:(.*?)-->/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]) as FormDesignMeta;
        if (parsed.theme && formThemes[parsed.theme]) theme = parsed.theme;
        if (parsed.buttonRadius) buttonRadius = parsed.buttonRadius;
        if (parsed.cardRadius) cardRadius = parsed.cardRadius;
        if (parsed.headingColor) headingColor = parsed.headingColor;
        if (parsed.descriptionColor) descriptionColor = parsed.descriptionColor;
      }
      cleanDescription = description.replace(/<!--style:.*?-->/g, '').trim();
    } catch (e) {
      console.warn('Failed to parse description style meta', e);
    }
  } else if (formTheme) {
    const rawTheme = formTheme.split('|')[0] as FormTheme;
    if (formThemes[rawTheme]) theme = rawTheme;
    if (formTheme.includes('|')) {
      const parts = formTheme.split('|');
      for (let i = 1; i < parts.length; i++) {
        const [k, v] = parts[i].split(':');
        if (k === 'button' && v) buttonRadius = v;
        if (k === 'card' && v) cardRadius = v;
        if (k === 'heading' && v) headingColor = v.startsWith('#') ? v : `#${v}`;
        if (k === 'description' && v) descriptionColor = v.startsWith('#') ? v : `#${v}`;
      }
    }
  }

  // Set default radius if not explicitly configured
  const hasCustomButton = description?.includes('buttonRadius') || formTheme?.includes('|button:');
  const hasCustomCard = description?.includes('cardRadius') || formTheme?.includes('|card:');

  if (!hasCustomButton) {
    if (theme === 'soft-ui' || theme === 'vibrant-neo') buttonRadius = 'full';
    else if (theme === 'warm-editorial') buttonRadius = 'none';
    else buttonRadius = 'xl';
  }

  if (!hasCustomCard) {
    if (theme === 'soft-ui' || theme === 'vibrant-neo') cardRadius = '3xl';
    else if (theme === 'warm-editorial') cardRadius = 'none';
    else cardRadius = '2xl';
  }

  const validTheme = formThemes[theme] ? theme : 'generic';

  return {
    theme: validTheme,
    buttonRadius,
    cardRadius,
    headingColor,
    descriptionColor,
    cleanDescription,
  };
}

export function encodeDescriptionWithMeta(
  description: string,
  meta: FormDesignMeta
): string {
  const clean = (description || '').replace(/<!--style:.*?-->/g, '').trim();
  const metaJson = JSON.stringify(meta);
  return `${clean} <!--style:${metaJson}-->`.trim();
}

/**
 * Returns theme configuration or falls back to 'generic'
 */
export function getThemeConfig(themeRaw?: string): FormThemeConfig {
  const { theme } = extractDesignMeta(undefined, themeRaw);
  if (theme && formThemes[theme]) {
    return formThemes[theme];
  }
  return formThemes.generic;
}

/**
 * Parses composite theme string e.g. "soft-ui|button:full|card:3xl|heading:#000000|description:#666666"
 */
export function parseThemeString(
  themeString?: string | null,
  colorString?: string | null
): {
  theme: FormTheme;
  buttonRadius: string;
  cardRadius: string;
  headingColor?: string;
  descriptionColor?: string;
} {
  return extractDesignMeta(undefined, themeString);
}

export function cleanColorString(colorString?: string | null): string {
  if (!colorString) return '#4F46E5';
  const raw = colorString.split('|')[0].trim();
  if (raw.startsWith('#') && (raw.length === 7 || raw.length === 4)) return raw;
  if (raw.startsWith('#')) return raw.slice(0, 7);
  return '#4F46E5';
}

/**
 * Encodes theme, button radius, card radius, and custom typography colors into string
 */
export function encodeThemeString(
  theme: FormTheme,
  buttonRadius: string = 'xl',
  cardRadius: string = '2xl',
  headingColor?: string,
  descriptionColor?: string
): string {
  let str = `${theme}|button:${buttonRadius}|card:${cardRadius}`;
  if (headingColor) str += `|heading:${headingColor.replace('#', '')}`;
  if (descriptionColor) str += `|description:${descriptionColor.replace('#', '')}`;
  return str;
}

export function getButtonRadiusValue(radius?: string): string {
  switch (radius) {
    case 'none': return '0px';
    case 'md': return '8px';
    case 'full': return '9999px';
    case 'xl':
    default: return '14px';
  }
}

export function getCardRadiusValue(radius?: string): string {
  switch (radius) {
    case 'none': return '0px';
    case 'xl': return '16px';
    case '3xl': return '32px';
    case '2xl':
    default: return '24px';
  }
}

export function getButtonRadiusClass(radius?: string): string {
  switch (radius) {
    case 'none': return '!rounded-none';
    case 'md': return '!rounded-lg';
    case 'full': return '!rounded-full';
    case 'xl':
    default: return '!rounded-xl';
  }
}

export function getCardRadiusClass(radius?: string): string {
  switch (radius) {
    case 'none': return '!rounded-none';
    case 'xl': return '!rounded-xl';
    case '3xl': return '!rounded-3xl';
    case '2xl':
    default: return '!rounded-2xl';
  }
}

export const softUIStyles = `
  .apple-bg {
    background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 40%, #FAF5FF 70%, #FCE7F3 100%);
  }

  @keyframes appleFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-30px, -40px) scale(1.1); }
    66% { transform: translate(30px, -20px) scale(0.95); }
  }
  
  .apple-decorations-ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .apple-orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(80px);
    opacity: 0.55;
    animation: appleFloat 16s ease-in-out infinite;
  }

  .orb-1 {
    top: -5%;
    right: -5%;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(168, 85, 247, 0.25) 70%, transparent 100%);
  }

  .orb-2 {
    bottom: -10%;
    left: -10%;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(139, 92, 246, 0.25) 70%, transparent 100%);
    animation-delay: -5s;
  }

  .orb-3 {
    top: 35%;
    left: 20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(99, 102, 241, 0.15) 70%, transparent 100%);
    animation-delay: -10s;
  }
  
  .apple-glass-card {
    background: rgba(255, 255, 255, 0.52) !important;
    backdrop-filter: blur(28px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
    border: 1.5px solid rgba(255, 255, 255, 0.85) !important;
    box-shadow: 
      0 30px 60px -12px rgba(99, 102, 241, 0.16),
      0 0 0 1px rgba(255, 255, 255, 0.7),
      inset 0 1.5px 2px rgba(255, 255, 255, 0.95) !important;
  }
  
  .apple-input {
    background: rgba(255, 255, 255, 0.6) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border: 1.5px solid rgba(255, 255, 255, 0.75) !important;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.02),
      inset 0 1px 1px rgba(255, 255, 255, 0.85) !important;
  }
  
  .apple-input:focus {
    background: rgba(255, 255, 255, 0.9) !important;
    border-color: rgba(99, 102, 241, 0.6) !important;
    box-shadow: 
      0 0 0 4px rgba(99, 102, 241, 0.18),
      0 8px 25px rgba(99, 102, 241, 0.12),
      inset 0 1px 1px rgba(255, 255, 255, 0.95) !important;
  }

  .option-glass-card {
    background: rgba(255, 255, 255, 0.55) !important;
    backdrop-filter: blur(18px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(18px) saturate(180%) !important;
    border: 1.5px solid rgba(255, 255, 255, 0.8) !important;
    box-shadow: 
      0 8px 24px rgba(99, 102, 241, 0.06),
      inset 0 1px 1px rgba(255, 255, 255, 0.9) !important;
  }

  .option-glass-card:hover {
    background: rgba(255, 255, 255, 0.8) !important;
    border-color: rgba(255, 255, 255, 0.95) !important;
    box-shadow: 
      0 16px 36px rgba(99, 102, 241, 0.14),
      inset 0 1px 1px rgba(255, 255, 255, 1) !important;
  }
  
  .apple-button {
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    box-shadow: 
      0 8px 25px rgba(79, 70, 229, 0.3),
      inset 0 1px 0.5px rgba(255, 255, 255, 0.4) !important;
  }
  
  .apple-button:hover {
    transform: translateY(-1px) scale(1.01);
    box-shadow: 
      0 12px 32px rgba(79, 70, 229, 0.4),
      inset 0 1px 0.5px rgba(255, 255, 255, 0.5) !important;
  }

  .apple-button-secondary {
    background: rgba(255, 255, 255, 0.65) !important;
    backdrop-filter: blur(16px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
    border: 1.5px solid rgba(255, 255, 255, 0.8) !important;
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.03),
      inset 0 1px 0.5px rgba(255, 255, 255, 0.9) !important;
  }

  .apple-button-secondary:hover {
    background: rgba(255, 255, 255, 0.88) !important;
  }
`;

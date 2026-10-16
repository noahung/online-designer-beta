import { useEffect } from 'react';
import { FormTheme, getThemeConfig, softUIStyles } from './formThemes';

interface CustomFormColors {
  primaryButtonColor?: string;
  primaryButtonTextColor?: string;
  secondaryButtonColor?: string;
  secondaryButtonTextColor?: string;
  accentColor?: string;
}

/**
 * Dynamically injects Google Fonts link and custom CSS variables for the selected theme
 */
export function injectThemeStyles(
  themeName: FormTheme | string = 'generic',
  customColors?: CustomFormColors,
  customFontFamily?: string
) {
  const theme = getThemeConfig(themeName);
  const head = document.head;

  // 1. Inject Google Fonts if available
  if (theme.fonts.googleFontUrl) {
    const fontLinkId = `form-font-${theme.id}`;
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href = theme.fonts.googleFontUrl;
      head.appendChild(link);
    }
  }

  // 2. Inject Theme Custom CSS Rules (softUIStyles, animations, custom variables)
  const styleTagId = 'form-theme-dynamic-styles';
  let styleTag = document.getElementById(styleTagId) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleTagId;
    head.appendChild(styleTag);
  }

  const primaryBtn = customColors?.primaryButtonColor || theme.preview.primaryColor;
  const primaryText = customColors?.primaryButtonTextColor || '#FFFFFF';
  const secondaryBtn = customColors?.secondaryButtonColor || theme.preview.secondaryColor;
  const secondaryText = customColors?.secondaryButtonTextColor || '#1E293B';
  const fontFam = customFontFamily || theme.fonts.body;

  styleTag.textContent = `
    :root {
      --form-primary-btn: ${primaryBtn};
      --form-primary-btn-text: ${primaryText};
      --form-secondary-btn: ${secondaryBtn};
      --form-secondary-btn-text: ${secondaryText};
      --form-font-family: ${fontFam};
    }

    .theme-font-body {
      font-family: var(--form-font-family, ${theme.fonts.body}) !important;
    }

    .theme-font-heading {
      font-family: ${theme.fonts.heading} !important;
    }

    ${softUIStyles}
  `;
}

/**
 * React hook to auto-inject theme styles on mount / when theme or colors change
 */
export function useFormThemeInjector(
  themeName: FormTheme | string = 'generic',
  customColors?: CustomFormColors,
  customFontFamily?: string
) {
  useEffect(() => {
    injectThemeStyles(themeName, customColors, customFontFamily);
  }, [themeName, customColors?.primaryButtonColor, customColors?.primaryButtonTextColor, customColors?.secondaryButtonColor, customColors?.secondaryButtonTextColor, customFontFamily]);
}

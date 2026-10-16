/**
 * Performance monitoring utilities - Like Monday.com/Typeform
 */

// Intersection Observer for smooth animations
export const createAnimationObserver = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px'
    }
  );

  // Observe all elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });

  return observer;
};

// Stagger animation utility
export const setupStaggerAnimation = () => {
  document.querySelectorAll('.stagger-children').forEach((parent) => {
    const children = parent.children;
    Array.from(children).forEach((child, index) => {
      (child as HTMLElement).style.setProperty('--index', index.toString());
      (child as HTMLElement).style.setProperty('--stagger', '0.1s');
    });
  });
};

// Performance monitoring (disabled to save resources)
export const monitorPerformance = () => {
  // FPS monitoring loop removed to prevent unnecessary requestAnimationFrame overhead
  return;
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Set up animation observer on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createAnimationObserver();
      setupStaggerAnimation();
      monitorPerformance();
    });
  } else {
    createAnimationObserver();
    setupStaggerAnimation();
    monitorPerformance();
  }
};

// Smooth scroll utility
export const smoothScrollTo = (element: HTMLElement, offset = 0) => {
  const elementPosition = element.offsetTop - offset;
  
  window.scrollTo({
    top: elementPosition,
    behavior: 'smooth'
  });
};

// Debounced resize handler
export const createResizeHandler = (callback: () => void, delay = 100) => {
  let timeoutId: number;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(callback, delay);
  };
};

// Throttled scroll handler
export const createScrollHandler = (callback: () => void, delay = 16) => {
  let isThrottled = false;
  
  return () => {
    if (!isThrottled) {
      callback();
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    }
  };
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined') return;

  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [10, 100, 10],
      error: [10, 50, 10, 50, 10],
    };

    navigator.vibrate(patterns[type]);
  }

  if ((window as any).Telegram?.WebApp?.HapticFeedback) {
    const tgHaptic = (window as any).Telegram.WebApp.HapticFeedback;
    
    switch (type) {
      case 'light':
        tgHaptic.impactOccurred('light');
        break;
      case 'medium':
        tgHaptic.impactOccurred('medium');
        break;
      case 'heavy':
        tgHaptic.impactOccurred('heavy');
        break;
      case 'success':
        tgHaptic.notificationOccurred('success');
        break;
      case 'warning':
        tgHaptic.notificationOccurred('warning');
        break;
      case 'error':
        tgHaptic.notificationOccurred('error');
        break;
    }
  }
};

export const useHapticFeedback = () => {
  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
  };
};

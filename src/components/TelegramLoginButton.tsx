import { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (user: any) => void;
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: any) => void;
    };
  }
}

const TelegramLoginButton = ({ botName, onAuth }: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    window.TelegramLoginWidget = {
      dataOnauth: (user: any) => {
        onAuth(user);
      },
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [botName, onAuth]);

  return <div ref={containerRef} />;
};

export default TelegramLoginButton;

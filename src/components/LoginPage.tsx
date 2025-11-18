import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import TelegramLoginButton from '@/components/TelegramLoginButton';

interface LoginPageProps {
  onAuth: (user: any) => void;
  error?: string | null;
}

const LoginPage = ({ onAuth, error }: LoginPageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (user: any) => {
    setIsLoading(true);
    try {
      await onAuth(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 glass-card animate-scale-in">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-purple flex items-center justify-center">
            <Icon name="Bot" size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">TeleBot Platform</h1>
            <p className="text-muted-foreground">
              Управляйте вашими Telegram-ботами в одном месте
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Войдите через Telegram, чтобы начать
            </p>
            {error && (
              <Alert variant="destructive" className="text-left">
                <Icon name="AlertCircle" size={16} className="inline mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Icon name="Loader2" size={24} className="animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Авторизация...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <TelegramLoginButton
                  botName="generickeytest"
                  onAuth={handleAuth}
                />
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 Если кнопка не появилась:</p>
              <p>• Проверьте, что домен настроен в @BotFather</p>
              <p>• Попробуйте обновить страницу</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
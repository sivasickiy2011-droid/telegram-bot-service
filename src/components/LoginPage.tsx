import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import TelegramLoginButton from '@/components/TelegramLoginButton';

interface LoginPageProps {
  onAuth: (user: any) => void;
  error?: string | null;
}

const LoginPage = ({ onAuth, error }: LoginPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDevForm, setShowDevForm] = useState(false);
  const [devUserId, setDevUserId] = useState('');

  const handleAuth = async (user: any) => {
    setIsLoading(true);
    try {
      await onAuth(user);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevAuth = async () => {
    if (!devUserId) return;
    
    const mockUser = {
      id: parseInt(devUserId),
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      photo_url: ''
    };
    
    await handleAuth(mockUser);
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
            ) : showDevForm ? (
              <div className="space-y-3">
                <Input
                  type="number"
                  placeholder="Введите Telegram ID"
                  value={devUserId}
                  onChange={(e) => setDevUserId(e.target.value)}
                />
                <Button 
                  className="w-full gradient-purple border-0" 
                  onClick={handleDevAuth}
                  disabled={!devUserId}
                >
                  Войти для теста
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowDevForm(false)}
                >
                  Назад к Telegram виджету
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">Для входа:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Откройте @generickeytest_bot в Telegram</li>
                    <li>Нажмите кнопку "Открыть приложение" в меню бота</li>
                  </ol>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  или для разработки
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowDevForm(true)}
                >
                  Тестовый вход (ID)
                </Button>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <a 
              href="/admin" 
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              <Icon name="Shield" size={12} />
              Вход для администраторов
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
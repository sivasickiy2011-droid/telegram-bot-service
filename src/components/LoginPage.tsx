import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import TelegramLoginButton from '@/components/TelegramLoginButton';

interface LoginPageProps {
  onAuth: (user: any) => void;
}

const LoginPage = ({ onAuth }: LoginPageProps) => {
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
            <div className="flex justify-center">
              <TelegramLoginButton
                botName="YOUR_BOT_NAME"
                onAuth={onAuth}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;

import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AppHeaderProps {
  currentUser: any;
  isTelegramApp: boolean;
  onLogout: () => void;
}

const AppHeader = ({ currentUser, isTelegramApp, onLogout }: AppHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
              <Icon name="Bot" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TeleBot Platform</h1>
              <p className="text-sm text-muted-foreground">Управление Telegram-ботами</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-sm font-bold">
                {currentUser?.first_name?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium">{currentUser?.first_name}</span>
            </div>
            {!isTelegramApp && (
              <Button variant="outline" size="sm" onClick={onLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;

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
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-purple flex items-center justify-center">
              <Icon name="Bot" className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold">TeleBot Platform</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Управление Telegram-ботами</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-muted/30">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full gradient-purple flex items-center justify-center text-white text-xs md:text-sm font-bold">
                {currentUser?.first_name?.[0] || 'U'}
              </div>
              <span className="text-xs md:text-sm font-medium hidden sm:inline">{currentUser?.first_name}</span>
            </div>
            {!isTelegramApp && (
              <Button variant="outline" size="sm" onClick={onLogout} className="hidden md:flex">
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            )}
            {!isTelegramApp && (
              <Button variant="outline" size="icon" onClick={onLogout} className="md:hidden h-9 w-9">
                <Icon name="LogOut" size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
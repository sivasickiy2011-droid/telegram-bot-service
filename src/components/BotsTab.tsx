import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
}

interface BotsTabProps {
  bots: Bot[];
  newBotName: string;
  newBotToken: string;
  isCreatingBot: boolean;
  setNewBotName: (value: string) => void;
  setNewBotToken: (value: string) => void;
  handleCreateBot: () => void;
  getStatusColor: (status: string) => string;
}

const BotsTab = ({
  bots,
  newBotName,
  newBotToken,
  isCreatingBot,
  setNewBotName,
  setNewBotToken,
  handleCreateBot,
  getStatusColor,
}: BotsTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Мои боты</h2>
          <p className="text-muted-foreground mt-1">Управляйте вашими Telegram-ботами</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-purple border-0">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать бота
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Создать нового бота</DialogTitle>
              <DialogDescription>
                Выберите шаблон и настройте вашего бота
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Название бота</Label>
                <Input 
                  id="bot-name" 
                  placeholder="Мой крутой бот" 
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot-token">Telegram Bot Token</Label>
                <Input 
                  id="bot-token" 
                  placeholder="123456:ABC-DEF..." 
                  type="password"
                  value={newBotToken}
                  onChange={(e) => setNewBotToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Шаблон</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <p className="font-semibold">POLYTOPE</p>
                      <p className="text-xs text-muted-foreground">Бот с QR-ключами и VIP-доступом</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogTrigger asChild>
                <Button variant="outline">Отмена</Button>
              </DialogTrigger>
              <Button 
                className="gradient-purple border-0" 
                onClick={handleCreateBot}
                disabled={isCreatingBot}
              >
                {isCreatingBot ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <Card
            key={bot.id}
            className="p-6 glass-card hover:scale-105 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center">
                  <Icon name="Bot" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold">{bot.name}</h3>
                  <p className="text-xs text-muted-foreground">{bot.template}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`} />
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Пользователи</span>
                <span className="font-semibold">{bot.users}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Сообщения</span>
                <span className="font-semibold">{bot.messages}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Icon name="Settings" size={14} className="mr-1" />
                Настройки
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Icon name="BarChart3" size={14} className="mr-1" />
                Статистика
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BotsTab;

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createOrUpdateUser, getBots, createBot } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import LoginPage from '@/components/LoginPage';
import DashboardTab from '@/components/DashboardTab';
import BotsTab from '@/components/BotsTab';
import AdminTab from '@/components/AdminTab';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  botsCount: number;
  status: 'active' | 'pending';
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadUserBots(user.id);
    }
  }, []);

  const loadUserBots = async (userId: number) => {
    try {
      const response = await getBots(userId);
      setBots(response.bots.map((bot: any) => ({
        id: bot.id.toString(),
        name: bot.name,
        status: bot.status,
        users: bot.total_users,
        messages: bot.total_messages,
        template: bot.template,
      })));
    } catch (error) {
      console.error('Failed to load bots:', error);
    }
  };

  const handleTelegramAuth = async (telegramUser: any) => {
    try {
      const response = await createOrUpdateUser({
        telegram_id: telegramUser.id,
        username: telegramUser.username || '',
        first_name: telegramUser.first_name || '',
        last_name: telegramUser.last_name || '',
        photo_url: telegramUser.photo_url || '',
      });

      const user = response.user;
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('telegram_user', JSON.stringify(user));
      
      toast({
        title: 'Авторизация успешна',
        description: `Добро пожаловать, ${user.first_name}!`,
      });

      loadUserBots(user.id);
    } catch (error) {
      toast({
        title: 'Ошибка авторизации',
        description: 'Не удалось авторизоваться через Telegram',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBot = async () => {
    if (!newBotName || !newBotToken) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingBot(true);
    try {
      await createBot({
        user_id: currentUser.id,
        name: newBotName,
        telegram_token: newBotToken,
        template: 'POLYTOPE',
      });

      toast({
        title: 'Бот создан',
        description: 'Ваш бот успешно добавлен',
      });

      setNewBotName('');
      setNewBotToken('');
      loadUserBots(currentUser.id);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать бота',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBot(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('telegram_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setBots([]);
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!',
    });
  };

  const [users] = useState<User[]>([
    { id: '1', name: 'Иван Петров', username: '@ivanpetrov', botsCount: 2, status: 'active' },
    { id: '2', name: 'Мария Сидорова', username: '@mariasid', botsCount: 1, status: 'pending' },
    { id: '3', name: 'Алексей Смирнов', username: '@alexsmirnov', botsCount: 3, status: 'active' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onAuth={handleTelegramAuth} />;
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-12">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Icon name="LayoutDashboard" size={16} />
                Дашборд
              </TabsTrigger>
              <TabsTrigger value="bots" className="flex items-center gap-2">
                <Icon name="Bot" size={16} />
                Мои боты
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Icon name="Shield" size={16} />
                Админ-панель
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab 
                bots={bots} 
                users={users} 
                getStatusColor={getStatusColor} 
              />
            </TabsContent>

            <TabsContent value="bots">
              <BotsTab
                bots={bots}
                newBotName={newBotName}
                newBotToken={newBotToken}
                isCreatingBot={isCreatingBot}
                setNewBotName={setNewBotName}
                setNewBotToken={setNewBotToken}
                handleCreateBot={handleCreateBot}
                getStatusColor={getStatusColor}
              />
            </TabsContent>

            <TabsContent value="admin">
              <AdminTab 
                users={users} 
                getStatusColor={getStatusColor} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TelegramLoginButton from '@/components/TelegramLoginButton';
import { createOrUpdateUser, getBots, createBot } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

  const stats = [
    { label: 'Всего ботов', value: bots.length.toString(), change: '+' + bots.length, icon: 'Bot', gradient: 'gradient-purple' },
    { label: 'Активных ботов', value: bots.filter(b => b.status === 'active').length.toString(), change: '+' + bots.filter(b => b.status === 'active').length, icon: 'Users', gradient: 'gradient-blue' },
    { label: 'Всего пользователей', value: bots.reduce((sum, b) => sum + b.users, 0).toString(), change: '+23%', icon: 'MessageSquare', gradient: 'gradient-orange' },
    { label: 'Всего сообщений', value: bots.reduce((sum, b) => sum + b.messages, 0).toString(), change: '+45', icon: 'Key', gradient: 'gradient-purple' },
  ];

  if (!isAuthenticated) {
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
                  onAuth={handleTelegramAuth}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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

            <TabsContent value="dashboard" className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    className="p-6 glass-card hover:scale-105 transition-transform duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                        <Icon name={stat.icon as any} size={24} className="text-white" />
                      </div>
                      <Badge variant="secondary" className="text-green-400 bg-green-400/10">
                        {stat.change}
                      </Badge>
                    </div>
                    <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Активность ботов</h3>
                    <Button variant="outline" size="sm">
                      <Icon name="RefreshCw" size={14} />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {bots.slice(0, 3).map((bot) => (
                      <div key={bot.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(bot.status)}`} />
                          <div>
                            <p className="font-semibold">{bot.name}</p>
                            <p className="text-sm text-muted-foreground">{bot.users} пользователей</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{bot.messages}</p>
                          <p className="text-xs text-muted-foreground">сообщений</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Последние пользователи</h3>
                    <Button variant="outline" size="sm">
                      <Icon name="UserPlus" size={14} />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {users.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-blue flex items-center justify-center text-white font-bold">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.username}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status === 'active' ? 'Активен' : 'Ожидает'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bots" className="space-y-6 animate-fade-in">
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
            </TabsContent>

            <TabsContent value="admin" className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold">Админ-панель</h2>
                <p className="text-muted-foreground mt-1">Управление пользователями и оплатами</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Users" size={20} className="text-primary" />
                    <h3 className="font-semibold">Пользователи</h3>
                  </div>
                  <p className="text-3xl font-bold">248</p>
                  <p className="text-sm text-muted-foreground">Всего зарегистрировано</p>
                </Card>
                <Card className="p-6 glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="DollarSign" size={20} className="text-green-400" />
                    <h3 className="font-semibold">Оплаты</h3>
                  </div>
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Ожидают подтверждения</p>
                </Card>
                <Card className="p-6 glass-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="Key" size={20} className="text-magenta" />
                    <h3 className="font-semibold">VIP-ключи</h3>
                  </div>
                  <p className="text-3xl font-bold">89</p>
                  <p className="text-sm text-muted-foreground">Активных ключей</p>
                </Card>
              </div>

              <Card className="glass-card">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Список пользователей</h3>
                    <div className="flex gap-2">
                      <Input placeholder="Поиск..." className="w-64" />
                      <Button variant="outline" size="icon">
                        <Icon name="Search" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Telegram</TableHead>
                      <TableHead>Ботов</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-sm font-bold">
                              {user.name[0]}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.botsCount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status === 'active' ? 'Активен' : 'Ожидает'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Icon name="Eye" size={14} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Icon name="Edit" size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
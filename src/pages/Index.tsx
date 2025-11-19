import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createOrUpdateUser, getBots, createBot } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import LoginPage from '@/components/LoginPage';
import RegistrationForm from '@/components/RegistrationForm';
import DashboardTab from '@/components/DashboardTab';
import BotsTab from '@/components/BotsTab';
import AdminTab from '@/components/AdminTab';
import ModerationTab from '@/components/ModerationTab';
import BotActivationTab from '@/components/BotActivationTab';
import QrRotationTab from '@/components/QrRotationTab';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
}



const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotToken, setNewBotToken] = useState('');
  const [newBotDescription, setNewBotDescription] = useState('');
  const [newBotLogic, setNewBotLogic] = useState('');
  const [newBotTemplate, setNewBotTemplate] = useState('keys');
  const [uniqueNumber, setUniqueNumber] = useState('');
  const [qrFreeCount, setQrFreeCount] = useState(500);
  const [qrPaidCount, setQrPaidCount] = useState(500);
  const [qrRotationValue, setQrRotationValue] = useState(0);
  const [qrRotationUnit, setQrRotationUnit] = useState('never');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [tempTelegramUser, setTempTelegramUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkTelegramWebApp = () => {
      const tg = (window as any).Telegram?.WebApp;
      console.log('Telegram WebApp:', tg);
      console.log('initDataUnsafe:', tg?.initDataUnsafe);
      
      if (tg) {
        setIsTelegramApp(true);
        tg.ready();
        tg.expand();
        
        if (tg.initDataUnsafe?.user) {
          const tgUser = tg.initDataUnsafe.user;
          console.log('Telegram user detected:', tgUser);
          
          const telegramUser = {
            id: tgUser.id,
            first_name: tgUser.first_name || '',
            last_name: tgUser.last_name || '',
            username: tgUser.username || '',
            photo_url: tgUser.photo_url || ''
          };
          
          handleTelegramAuth(telegramUser);
          return;
        } else {
          console.log('No user in initDataUnsafe');
        }
      } else {
        console.log('Telegram WebApp not found');
      }
    };
    
    setTimeout(checkTelegramWebApp, 100);
    
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
        moderationStatus: bot.moderation_status,
        moderationReason: bot.moderation_reason,
        payment_url: bot.payment_url,
        payment_enabled: bot.payment_enabled,
        qr_free_count: bot.qr_free_count,
        qr_paid_count: bot.qr_paid_count,
        qr_rotation_value: bot.qr_rotation_value,
        qr_rotation_unit: bot.qr_rotation_unit,
      })));
    } catch (error) {
      console.error('Failed to load bots:', error);
    }
  };

  const handleTelegramAuth = async (telegramUser: any) => {
    setAuthError(null);
    
    if (!telegramUser || !telegramUser.id) {
      setAuthError('Не удалось получить данные от Telegram. Попробуйте еще раз.');
      return;
    }

    try {
      const response = await createOrUpdateUser({
        telegram_id: telegramUser.id,
        username: telegramUser.username || '',
        first_name: telegramUser.first_name || '',
        last_name: telegramUser.last_name || '',
        photo_url: telegramUser.photo_url || '',
      });

      if (!response || !response.user) {
        throw new Error('Некорректный ответ от сервера');
      }

      const user = response.user;
      console.log('User logged in:', user);
      console.log('User role:', user.role);
      console.log('Registration completed:', user.registration_completed);
      
      if (user.role !== 'admin' && !user.registration_completed) {
        setTempTelegramUser(telegramUser);
        setNeedsRegistration(true);
        return;
      }
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('telegram_user', JSON.stringify(user));
      
      const roleText = user.role === 'admin' ? ' (Администратор)' : '';
      toast({
        title: 'Авторизация успешна',
        description: `Добро пожаловать, ${user.first_name}${roleText}!`,
      });

      await loadUserBots(user.id);
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Не удалось авторизоваться. Попробуйте позже.';
      
      if (error.message?.includes('fetch')) {
        errorMessage = 'Ошибка соединения с сервером. Проверьте интернет-соединение.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания. Попробуйте еще раз.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
      
      toast({
        title: 'Ошибка авторизации',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCreateBot = async () => {
    if (!newBotName || !newBotToken || !newBotDescription || !newBotLogic) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля, включая описание и логику бота',
        variant: 'destructive',
      });
      return;
    }

    if (!uniqueNumber || uniqueNumber.length !== 6) {
      toast({
        title: 'Ошибка',
        description: 'Укажите уникальный 6-значный номер бота',
        variant: 'destructive',
      });
      return;
    }

    const isAdmin = currentUser?.role === 'admin';
    
    if (!isAdmin && bots.length >= 1) {
      toast({
        title: 'Лимит достигнут',
        description: 'Вы можете создать только одного бота',
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
        template: newBotTemplate,
        description: newBotDescription,
        logic: newBotLogic,
        unique_number: uniqueNumber,
        qr_free_count: qrFreeCount,
        qr_paid_count: qrPaidCount,
        qr_rotation_value: qrRotationValue,
        qr_rotation_unit: qrRotationUnit,
        payment_enabled: paymentEnabled,
        payment_url: paymentUrl,
      });

      toast({
        title: 'Бот отправлен на модерацию',
        description: 'Администратор проверит настройки перед запуском',
      });

      setNewBotName('');
      setNewBotToken('');
      setNewBotDescription('');
      setNewBotLogic('');
      setUniqueNumber('');
      setQrFreeCount(500);
      setQrPaidCount(500);
      setQrRotationValue(0);
      setQrRotationUnit('never');
      setPaymentEnabled(false);
      setPaymentUrl('');
      setNewBotTemplate('keys');
      loadUserBots(currentUser.id);
    } catch (error: any) {
      console.error('Create bot error:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать бота',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBot(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bot_id: botId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete bot');
      }

      toast({
        title: 'Бот удален',
        description: 'Бот успешно удален из системы',
      });

      loadUserBots(currentUser.id);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бота',
        variant: 'destructive',
      });
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

  const handleRegistrationComplete = async (userData: any) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setNeedsRegistration(false);
    localStorage.setItem('telegram_user', JSON.stringify(userData));
    
    toast({
      title: 'Регистрация завершена',
      description: `Добро пожаловать, ${userData.first_name}!`,
    });
    
    await loadUserBots(userData.id);
  };

  if (needsRegistration) {
    return (
      <RegistrationForm
        onComplete={handleRegistrationComplete}
        telegramUser={tempTelegramUser}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onAuth={handleTelegramAuth} error={authError} />;
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
              {!isTelegramApp && (
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <Icon name="LogOut" size={16} className="mr-2" />
                  Выход
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className={`grid w-full max-w-5xl mx-auto h-12 ${currentUser?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-2'}`}>
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Icon name="LayoutDashboard" size={16} />
                Дашборд
              </TabsTrigger>
              <TabsTrigger value="bots" className="flex items-center gap-2">
                <Icon name="Bot" size={16} />
                Мои боты
              </TabsTrigger>
              {currentUser?.role === 'admin' && (
                <>
                  <TabsTrigger value="moderation" className="flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} />
                    Модерация
                  </TabsTrigger>
                  <TabsTrigger value="activation" className="flex items-center gap-2">
                    <Icon name="Play" size={16} />
                    Активация
                  </TabsTrigger>
                  <TabsTrigger value="rotation" className="flex items-center gap-2">
                    <Icon name="RefreshCw" size={16} />
                    Ротация
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Icon name="Shield" size={16} />
                    Пользователи
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab 
                bots={bots} 
                getStatusColor={getStatusColor} 
              />
            </TabsContent>

            <TabsContent value="bots">
              <BotsTab
                bots={bots}
                newBotName={newBotName}
                newBotToken={newBotToken}
                newBotDescription={newBotDescription}
                newBotLogic={newBotLogic}
                newBotTemplate={newBotTemplate}
                uniqueNumber={uniqueNumber}
                qrFreeCount={qrFreeCount}
                qrPaidCount={qrPaidCount}
                qrRotationValue={qrRotationValue}
                qrRotationUnit={qrRotationUnit}
                paymentEnabled={paymentEnabled}
                paymentUrl={paymentUrl}
                isCreatingBot={isCreatingBot}
                setNewBotName={setNewBotName}
                setNewBotToken={setNewBotToken}
                setNewBotDescription={setNewBotDescription}
                setNewBotLogic={setNewBotLogic}
                setNewBotTemplate={setNewBotTemplate}
                setUniqueNumber={setUniqueNumber}
                setQrFreeCount={setQrFreeCount}
                setQrPaidCount={setQrPaidCount}
                setQrRotationValue={setQrRotationValue}
                setQrRotationUnit={setQrRotationUnit}
                setPaymentEnabled={setPaymentEnabled}
                setPaymentUrl={setPaymentUrl}
                handleCreateBot={handleCreateBot}
                handleDeleteBot={handleDeleteBot}
                getStatusColor={getStatusColor}
                currentUser={currentUser}
              />
            </TabsContent>

            {currentUser?.role === 'admin' && (
              <>
                <TabsContent value="moderation">
                  <ModerationTab 
                    currentUser={currentUser}
                    onModerate={() => loadUserBots(currentUser.id)}
                  />
                </TabsContent>
                <TabsContent value="activation">
                  <BotActivationTab 
                    currentUser={currentUser}
                  />
                </TabsContent>
                <TabsContent value="rotation">
                  <QrRotationTab 
                    currentUser={currentUser}
                  />
                </TabsContent>
                <TabsContent value="admin">
                  <AdminTab 
                    getStatusColor={getStatusColor} 
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
import { useState, useEffect } from 'react';
import { createOrUpdateUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [tempTelegramUser, setTempTelegramUser] = useState<any>(null);
  const { toast } = useToast();

  const handleTelegramAuth = async (telegramUser: any, onSuccess?: (userId: number) => void) => {
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

      if (onSuccess) {
        await onSuccess(user.id);
      }
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

  const handleLogout = () => {
    localStorage.removeItem('telegram_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast({
      title: 'Выход выполнен',
      description: 'До встречи!',
    });
  };

  const handleRegistrationComplete = async (userData: any, onSuccess?: (userId: number) => void) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setNeedsRegistration(false);
    localStorage.setItem('telegram_user', JSON.stringify(userData));
    
    toast({
      title: 'Регистрация завершена',
      description: `Добро пожаловать, ${userData.first_name}!`,
    });
    
    if (onSuccess) {
      await onSuccess(userData.id);
    }
  };

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
    }
  }, []);

  return {
    currentUser,
    isAuthenticated,
    authError,
    isTelegramApp,
    needsRegistration,
    tempTelegramUser,
    handleTelegramAuth,
    handleLogout,
    handleRegistrationComplete,
  };
};

import { useState } from 'react';
import { getBots, createBot } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

export const useBotManagement = (currentUser: any) => {
  const [bots, setBots] = useState<Bot[]>([]);
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
  const [offerImageUrl, setOfferImageUrl] = useState('');
  const [privacyConsentEnabled, setPrivacyConsentEnabled] = useState(false);
  const [privacyConsentText, setPrivacyConsentText] = useState('Я согласен на обработку персональных данных');
  const [isCreatingBot, setIsCreatingBot] = useState(false);
  const { toast } = useToast();

  const loadUserBots = async (userId: number) => {
    try {
      await fetch('https://functions.poehali.dev/c76b9661-95e2-441d-ab96-0972bb18a478', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const response = await getBots(userId);
      setBots(response.bots.map((bot: any) => ({
        id: bot.id.toString(),
        name: bot.name,
        status: bot.status,
        users: bot.total_users || 0,
        messages: bot.total_messages || 0,
        template: bot.template,
        moderationStatus: bot.moderation_status,
        moderationReason: bot.moderation_reason,
        payment_url: bot.payment_url,
        payment_enabled: bot.payment_enabled,
        qr_free_count: bot.qr_free_count,
        qr_paid_count: bot.qr_paid_count,
        qr_rotation_value: bot.qr_rotation_value,
        qr_rotation_unit: bot.qr_rotation_unit,
        button_texts: bot.button_texts,
        message_texts: bot.message_texts,
        tbank_terminal_key: bot.tbank_terminal_key,
        tbank_password: bot.tbank_password,
        vip_price: bot.vip_price,
        offer_image_url: bot.offer_image_url,
        privacy_consent_enabled: bot.privacy_consent_enabled,
        privacy_consent_text: bot.privacy_consent_text,
      })));
    } catch (error) {
      console.error('Failed to load bots:', error);
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
        offer_image_url: offerImageUrl,
        privacy_consent_enabled: privacyConsentEnabled,
        privacy_consent_text: privacyConsentText,
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
      setOfferImageUrl('');
      setPrivacyConsentEnabled(false);
      setPrivacyConsentText('Я согласен на обработку персональных данных');
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

  return {
    bots,
    newBotName,
    newBotToken,
    newBotDescription,
    newBotLogic,
    newBotTemplate,
    uniqueNumber,
    qrFreeCount,
    qrPaidCount,
    qrRotationValue,
    qrRotationUnit,
    paymentEnabled,
    paymentUrl,
    offerImageUrl,
    privacyConsentEnabled,
    privacyConsentText,
    isCreatingBot,
    setNewBotName,
    setNewBotToken,
    setNewBotDescription,
    setNewBotLogic,
    setNewBotTemplate,
    setUniqueNumber,
    setQrFreeCount,
    setQrPaidCount,
    setQrRotationValue,
    setQrRotationUnit,
    setPaymentEnabled,
    setPaymentUrl,
    setOfferImageUrl,
    setPrivacyConsentEnabled,
    setPrivacyConsentText,
    loadUserBots,
    handleCreateBot,
    handleDeleteBot,
  };
};
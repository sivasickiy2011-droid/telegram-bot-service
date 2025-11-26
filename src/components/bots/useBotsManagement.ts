import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Bot } from './types';

export const useBotsManagement = (currentUser: any, onBotsUpdated?: () => void) => {
  const { toast } = useToast();
  
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [botStats, setBotStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [editPaymentUrl, setEditPaymentUrl] = useState('');
  const [editPaymentEnabled, setEditPaymentEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editButtonTexts, setEditButtonTexts] = useState<any>(null);
  const [editMessageTexts, setEditMessageTexts] = useState<any>(null);
  const [editTbankTerminalKey, setEditTbankTerminalKey] = useState('');
  const [editTbankPassword, setEditTbankPassword] = useState('');
  const [editVipPrice, setEditVipPrice] = useState(500);
  const [editOfferImageUrl, setEditOfferImageUrl] = useState('');
  const [editPrivacyConsentEnabled, setEditPrivacyConsentEnabled] = useState(false);
  const [editPrivacyConsentText, setEditPrivacyConsentText] = useState('');
  const [editVipPromoEnabled, setEditVipPromoEnabled] = useState(false);
  const [editVipPromoStartDate, setEditVipPromoStartDate] = useState('');
  const [editVipPromoEndDate, setEditVipPromoEndDate] = useState('');
  const [editVipPurchaseMessage, setEditVipPurchaseMessage] = useState('VIP-ключ открывает доступ к эксклюзивным материалам и привилегиям.');
  const [editTelegramToken, setEditTelegramToken] = useState('');
  const [restartingEngine, setRestartingEngine] = useState(false);
  
  const openSettings = (bot: any) => {
    setSelectedBot(bot);
    setEditPaymentUrl(bot.payment_url || '');
    setEditPaymentEnabled(bot.payment_enabled || false);
    setEditButtonTexts(bot.button_texts || null);
    
    const messageTexts = bot.message_texts || {};
    if (bot.secret_shop_text && !messageTexts.secret_shop) {
      messageTexts.secret_shop = bot.secret_shop_text;
    }
    setEditMessageTexts(messageTexts);
    
    setEditTbankTerminalKey(bot.tbank_terminal_key || '');
    setEditTbankPassword(bot.tbank_password || '');
    setEditVipPrice(bot.vip_price || 500);
    setEditOfferImageUrl(bot.offer_image_url || '');
    setEditPrivacyConsentEnabled(bot.privacy_consent_enabled || false);
    setEditPrivacyConsentText(bot.privacy_consent_text || 'Я согласен на обработку персональных данных');
    setEditVipPromoEnabled(bot.vip_promo_enabled || false);
    setEditVipPromoStartDate(bot.vip_promo_start_date || '');
    setEditVipPromoEndDate(bot.vip_promo_end_date || '');
    setEditVipPurchaseMessage(bot.vip_purchase_message || 'VIP-ключ открывает доступ к эксклюзивным материалам и привилегиям.');
    setEditTelegramToken(bot.telegram_token || '');
    setSettingsOpen(true);
  };
  
  const openStats = async (bot: Bot) => {
    setSelectedBot(bot);
    setStatsOpen(true);
    setLoadingStats(true);
    setBotStats(null);
    
    console.log('Opening stats for bot:', bot.id, bot.name);
    
    try {
      const statsUrl = `https://functions.poehali.dev/5c1d4d82-b836-4d64-b74e-c317fde888e9?bot_id=${bot.id}`;
      const usersUrl = `https://functions.poehali.dev/2b3fdb38-ec2a-4025-82c2-f33a66905630?bot_id=${bot.id}`;
      
      const [statsResponse, usersResponse] = await Promise.all([
        fetch(statsUrl),
        fetch(usersUrl)
      ]);
      
      const statsData = await statsResponse.json();
      const usersData = await usersResponse.json();
      
      if (statsResponse.ok) {
        const combinedStats = {
          ...statsData.stats,
          users_list: usersResponse.ok ? usersData.users : []
        };
        setBotStats(combinedStats);
      } else {
        toast({
          title: 'Ошибка',
          description: statsData.error || 'Не удалось загрузить статистику',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Stats loading error:', error);
      toast({
        title: 'Ошибка',
        description: `Не удалось загрузить статистику: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingStats(false);
    }
  };
  
  const saveSettings = async () => {
    if (!selectedBot) return;
    
    setSavingSettings(true);
    try {
      const bodyData: any = {
        bot_id: selectedBot.id,
        payment_url: editPaymentUrl,
        payment_enabled: editPaymentEnabled,
        telegram_token: editTelegramToken
      };
      
      if (editButtonTexts) bodyData.button_texts = editButtonTexts;
      if (editMessageTexts) bodyData.message_texts = editMessageTexts;
      if (editTbankTerminalKey) bodyData.tbank_terminal_key = editTbankTerminalKey;
      if (editTbankPassword) bodyData.tbank_password = editTbankPassword;
      if (editVipPrice) bodyData.vip_price = editVipPrice;
      if (editOfferImageUrl !== undefined) bodyData.offer_image_url = editOfferImageUrl;
      bodyData.privacy_consent_enabled = editPrivacyConsentEnabled;
      if (editPrivacyConsentText) bodyData.privacy_consent_text = editPrivacyConsentText;
      bodyData.vip_promo_enabled = editVipPromoEnabled;
      if (editVipPromoStartDate) bodyData.vip_promo_start_date = editVipPromoStartDate;
      if (editVipPromoEndDate) bodyData.vip_promo_end_date = editVipPromoEndDate;
      if (editVipPurchaseMessage) bodyData.vip_purchase_message = editVipPurchaseMessage;
      
      console.log('Saving bot settings:', bodyData);
      
      const response = await fetch('https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Настройки сохранены',
          description: 'Изменения успешно применены'
        });
        setSettingsOpen(false);
        if (onBotsUpdated) {
          onBotsUpdated();
        }
      } else {
        console.error('Save error:', data);
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить настройки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Save exception:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleStatus = async (botId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'включить' : 'отключить';
    
    if (!confirm(`Вы уверены, что хотите ${actionText} бота?`)) {
      return;
    }
    
    try {
      const response = await fetch('https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: botId,
          status: newStatus
        })
      });
      
      if (response.ok) {
        toast({
          title: 'Статус изменен',
          description: `Бот успешно ${newStatus === 'active' ? 'включен' : 'отключен'}`
        });
        if (onBotsUpdated) {
          onBotsUpdated();
        }
      } else {
        const data = await response.json();
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить статус бота',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус бота',
        variant: 'destructive'
      });
    }
  };

  const getBotTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      keys: '🔑 QR-ключи + VIP-доступ',
      shop: '🛍️ Интернет-магазин',
      warehouse: '🏭 Склад (бронирование)',
      subscription: '💎 Подписки и контент',
      support: '💬 Поддержка клиентов',
      custom: '⚙️ Кастомная логика',
    };
    return types[type] || type;
  };

  const handleRestartBotEngine = async () => {
    if (!confirm('Перезапустить движок ботов? Все боты будут перезапущены с новым кодом.')) {
      return;
    }

    setRestartingEngine(true);
    try {
      const response = await fetch('https://functions.poehali.dev/2487629c-72aa-43fe-9874-774729f6b499', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser?.id?.toString() || ''
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Движок перезапущен',
          description: data.message || 'Боты будут перезапущены с новым кодом'
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось перезапустить движок',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось перезапустить движок',
        variant: 'destructive'
      });
    } finally {
      setRestartingEngine(false);
    }
  };

  const handleSetupWebhook = async (botId: string) => {
    if (!confirm('Установить webhook для этого бота? Бот перейдет на webhook архитектуру.')) {
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/1e93e2c2-62f0-47e5-bb97-590cc26e5216', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bot_id: parseInt(botId) })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Webhook установлен',
          description: `Webhook URL: ${data.webhook_url}`
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось установить webhook',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось установить webhook',
        variant: 'destructive'
      });
    }
  };

  return {
    selectedBot,
    settingsOpen,
    setSettingsOpen,
    statsOpen,
    setStatsOpen,
    botStats,
    loadingStats,
    editPaymentUrl,
    setEditPaymentUrl,
    editPaymentEnabled,
    setEditPaymentEnabled,
    savingSettings,
    editButtonTexts,
    setEditButtonTexts,
    editMessageTexts,
    setEditMessageTexts,
    editTbankTerminalKey,
    setEditTbankTerminalKey,
    editTbankPassword,
    setEditTbankPassword,
    editVipPrice,
    setEditVipPrice,
    editOfferImageUrl,
    setEditOfferImageUrl,
    editPrivacyConsentEnabled,
    setEditPrivacyConsentEnabled,
    editPrivacyConsentText,
    setEditPrivacyConsentText,
    editVipPromoEnabled,
    setEditVipPromoEnabled,
    editVipPromoStartDate,
    setEditVipPromoStartDate,
    editVipPromoEndDate,
    setEditVipPromoEndDate,
    editVipPurchaseMessage,
    setEditVipPurchaseMessage,
    editTelegramToken,
    setEditTelegramToken,
    restartingEngine,
    openSettings,
    openStats,
    saveSettings,
    handleToggleStatus,
    getBotTypeLabel,
    handleRestartBotEngine,
    handleSetupWebhook,
  };
};
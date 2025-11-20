import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import CreateBotDialog from './bots/CreateBotDialog';
import BotCard from './bots/BotCard';
import BotSettingsDialog from './bots/BotSettingsDialog';
import BotStatsDialog from './bots/BotStatsDialog';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
  payment_url?: string;
  payment_enabled?: boolean;
  qr_free_count?: number;
  qr_paid_count?: number;
  qr_rotation_value?: number;
  qr_rotation_unit?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
}

interface BotsTabProps {
  bots: Bot[];
  newBotName: string;
  newBotToken: string;
  newBotDescription: string;
  newBotLogic: string;
  newBotTemplate: string;
  uniqueNumber: string;
  qrFreeCount: number;
  qrPaidCount: number;
  qrRotationValue: number;
  qrRotationUnit: string;
  paymentEnabled: boolean;
  paymentUrl: string;
  offerImageUrl: string;
  privacyConsentEnabled: boolean;
  privacyConsentText: string;
  secretShopText: string;
  isCreatingBot: boolean;
  setNewBotName: (value: string) => void;
  setNewBotToken: (value: string) => void;
  setNewBotDescription: (value: string) => void;
  setNewBotLogic: (value: string) => void;
  setNewBotTemplate: (value: string) => void;
  setUniqueNumber: (value: string) => void;
  setQrFreeCount: (value: number) => void;
  setQrPaidCount: (value: number) => void;
  setQrRotationValue: (value: number) => void;
  setQrRotationUnit: (value: string) => void;
  setPaymentEnabled: (value: boolean) => void;
  setPaymentUrl: (value: string) => void;
  setOfferImageUrl: (value: string) => void;
  setPrivacyConsentEnabled: (value: boolean) => void;
  setPrivacyConsentText: (value: string) => void;
  setSecretShopText: (value: string) => void;
  handleCreateBot: () => void;
  handleDeleteBot: (botId: string) => void;
  getStatusColor: (status: string) => string;
  currentUser?: any;
  onBotsUpdated?: () => void;
}

const BotsTab = ({
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
  secretShopText,
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
  setSecretShopText,
  handleCreateBot,
  handleDeleteBot,
  getStatusColor,
  currentUser,
  onBotsUpdated,
}: BotsTabProps) => {
  const isAdmin = currentUser?.role === 'admin';
  const canCreateBot = isAdmin || bots.length < 1;
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
        payment_enabled: editPaymentEnabled
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
      
      if (response.ok) {
        toast({
          title: 'Настройки сохранены',
          description: 'Все изменения успешно применены'
        });
        setSettingsOpen(false);
        if (onBotsUpdated) {
          onBotsUpdated();
        }
      } else {
        const data = await response.json();
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось сохранить настройки',
          variant: 'destructive'
        });
      }
    } catch (error) {
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
      subscription: '💎 Подписки и контент',
      support: '💬 Поддержка клиентов',
      custom: '⚙️ Кастомная логика',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-0">
      {!isAdmin && bots.length >= 1 && (
        <Card className="p-3 md:p-4 bg-muted/30 border-orange-500/50">
          <div className="flex items-start gap-2 md:gap-3">
            <Icon name="Info" size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs md:text-sm">
              <p className="font-medium mb-1">Базовый тариф</p>
              <p className="text-muted-foreground">
                Вы можете создать только одного бота с шаблоном POLYTOPE. Для расширенных возможностей обратитесь к администратору.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Мои боты</h2>
          <p className="text-muted-foreground text-sm mt-1">Управляйте вашими Telegram-ботами</p>
        </div>
        <CreateBotDialog
          canCreateBot={canCreateBot}
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
          offerImageUrl={offerImageUrl}
          privacyConsentEnabled={privacyConsentEnabled}
          privacyConsentText={privacyConsentText}
          secretShopText={secretShopText}
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
          setOfferImageUrl={setOfferImageUrl}
          setPrivacyConsentEnabled={setPrivacyConsentEnabled}
          setPrivacyConsentText={setPrivacyConsentText}
          setSecretShopText={setSecretShopText}
          handleCreateBot={handleCreateBot}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <BotCard
            key={bot.id}
            bot={bot}
            index={index}
            getStatusColor={getStatusColor}
            getBotTypeLabel={getBotTypeLabel}
            onSettings={openSettings}
            onStats={openStats}
            onDelete={handleDeleteBot}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>
      
      <BotSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        selectedBot={selectedBot}
        editPaymentUrl={editPaymentUrl}
        editPaymentEnabled={editPaymentEnabled}
        savingSettings={savingSettings}
        setEditPaymentUrl={setEditPaymentUrl}
        setEditPaymentEnabled={setEditPaymentEnabled}
        editButtonTexts={editButtonTexts}
        setEditButtonTexts={setEditButtonTexts}
        editMessageTexts={editMessageTexts}
        setEditMessageTexts={setEditMessageTexts}
        editTbankTerminalKey={editTbankTerminalKey}
        setEditTbankTerminalKey={setEditTbankTerminalKey}
        editTbankPassword={editTbankPassword}
        setEditTbankPassword={setEditTbankPassword}
        editVipPrice={editVipPrice}
        setEditVipPrice={setEditVipPrice}
        editOfferImageUrl={editOfferImageUrl}
        setEditOfferImageUrl={setEditOfferImageUrl}
        editPrivacyConsentEnabled={editPrivacyConsentEnabled}
        setEditPrivacyConsentEnabled={setEditPrivacyConsentEnabled}
        editPrivacyConsentText={editPrivacyConsentText}
        setEditPrivacyConsentText={setEditPrivacyConsentText}
        editVipPromoEnabled={editVipPromoEnabled}
        setEditVipPromoEnabled={setEditVipPromoEnabled}
        editVipPromoStartDate={editVipPromoStartDate}
        setEditVipPromoStartDate={setEditVipPromoStartDate}
        editVipPromoEndDate={editVipPromoEndDate}
        setEditVipPromoEndDate={setEditVipPromoEndDate}
        editVipPurchaseMessage={editVipPurchaseMessage}
        setEditVipPurchaseMessage={setEditVipPurchaseMessage}
        onSave={saveSettings}
      />
      
      <BotStatsDialog
        open={statsOpen}
        onOpenChange={setStatsOpen}
        selectedBot={selectedBot}
        botStats={botStats}
        loadingStats={loadingStats}
      />
    </div>
  );
};

export default BotsTab;
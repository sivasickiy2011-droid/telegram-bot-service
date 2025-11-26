import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BotSettingsDialog from '@/components/bots/BotSettingsDialog';
import { useToast } from '@/hooks/use-toast';
import UserBotsDialogContent from './user-bots/UserBotsDialogContent';

interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
  telegram_token?: string;
  payment_url?: string;
  payment_enabled?: boolean;
  qr_free_count?: number;
  qr_paid_count?: number;
  qr_rotation_value?: number;
  qr_rotation_unit?: string;
  button_texts?: any;
  message_texts?: any;
  tbank_terminal_key?: string;
  tbank_password?: string;
  vip_price?: number;
  offer_image_url?: string;
  privacy_consent_enabled?: boolean;
  privacy_consent_text?: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
}

interface UserBotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const UserBotsDialog = ({ open, onOpenChange, user }: UserBotsDialogProps) => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedBotIds, setSelectedBotIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const [editPaymentUrl, setEditPaymentUrl] = useState('');
  const [editPaymentEnabled, setEditPaymentEnabled] = useState(false);
  const [editButtonTexts, setEditButtonTexts] = useState({});
  const [editMessageTexts, setEditMessageTexts] = useState({});
  const [editTbankTerminalKey, setEditTbankTerminalKey] = useState('');
  const [editTbankPassword, setEditTbankPassword] = useState('');
  const [editVipPrice, setEditVipPrice] = useState(0);
  const [editOfferImageUrl, setEditOfferImageUrl] = useState('');
  const [editPrivacyConsentEnabled, setEditPrivacyConsentEnabled] = useState(false);
  const [editPrivacyConsentText, setEditPrivacyConsentText] = useState('');
  const [editTelegramToken, setEditTelegramToken] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadUserBots();
    }
  }, [open, user]);

  const loadUserBots = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5?user_id=${user.id}`);
      const data = await response.json();
      
      setBots(data.bots.map((bot: any) => ({
        id: bot.id.toString(),
        name: bot.name,
        status: bot.status,
        users: bot.total_users || 0,
        messages: bot.total_messages || 0,
        template: bot.template,
        telegram_token: bot.telegram_token,
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
      console.error('Failed to load user bots:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить ботов пользователя',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBotStatus = async (bot: Bot) => {
    const newStatus = bot.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch('https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_id: bot.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle bot status');
      }

      toast({
        title: 'Успешно',
        description: `Бот ${newStatus === 'active' ? 'запущен' : 'остановлен'}`,
      });

      loadUserBots();
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус бота',
        variant: 'destructive',
      });
    }
  };

  const handleReinstallWebhook = async (bot: Bot) => {
    try {
      const response = await fetch('https://functions.poehali.dev/5de84ef3-0564-49a9-95a1-05f3de4ba313', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_id: bot.id,
          action: 'setup',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reinstall webhook');
      }

      toast({
        title: 'Webhook переустановлен',
        description: `Webhook для бота "${bot.name}" успешно переустановлен`,
      });
    } catch (error) {
      console.error('Failed to reinstall webhook:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось переустановить webhook',
        variant: 'destructive',
      });
    }
  };

  const openSettings = (bot: Bot) => {
    setSelectedBot(bot);
    setEditPaymentUrl(bot.payment_url || '');
    setEditPaymentEnabled(bot.payment_enabled || false);
    setEditButtonTexts(bot.button_texts || {});
    setEditMessageTexts(bot.message_texts || {});
    setEditTbankTerminalKey(bot.tbank_terminal_key || '');
    setEditTbankPassword(bot.tbank_password || '');
    setEditVipPrice(bot.vip_price || 0);
    setEditOfferImageUrl(bot.offer_image_url || '');
    setEditPrivacyConsentEnabled(bot.privacy_consent_enabled || false);
    setEditPrivacyConsentText(bot.privacy_consent_text || 'Я согласен на обработку персональных данных');
    setEditTelegramToken(bot.telegram_token || '');
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedBot) return;

    setSavingSettings(true);
    try {
      const response = await fetch('https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_id: selectedBot.id,
          telegram_token: editTelegramToken,
          payment_url: editPaymentUrl,
          payment_enabled: editPaymentEnabled,
          button_texts: editButtonTexts,
          message_texts: editMessageTexts,
          tbank_terminal_key: editTbankTerminalKey,
          tbank_password: editTbankPassword,
          vip_price: editVipPrice,
          offer_image_url: editOfferImageUrl,
          privacy_consent_enabled: editPrivacyConsentEnabled,
          privacy_consent_text: editPrivacyConsentText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bot settings');
      }

      toast({
        title: 'Успешно',
        description: 'Настройки бота обновлены',
      });

      setSettingsOpen(false);
      loadUserBots();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого бота?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5', {
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
        title: 'Успешно',
        description: 'Бот удалён',
      });

      loadUserBots();
    } catch (error) {
      console.error('Failed to delete bot:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бота',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBotIds.size === 0) return;
    if (!confirm(`Вы уверены, что хотите удалить выбранные боты (${selectedBotIds.size})?`)) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedBotIds).map(botId =>
        fetch('https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bot_id: botId }),
        })
      );

      await Promise.all(deletePromises);

      toast({
        title: 'Успешно',
        description: `Удалено ботов: ${selectedBotIds.size}`,
      });

      setSelectedBotIds(new Set());
      loadUserBots();
    } catch (error) {
      console.error('Failed to delete bots:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить некоторые боты',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleBotSelection = (botId: string) => {
    setSelectedBotIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(botId)) {
        newSet.delete(botId);
      } else {
        newSet.add(botId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedBotIds.size === bots.length) {
      setSelectedBotIds(new Set());
    } else {
      setSelectedBotIds(new Set(bots.map(b => b.id)));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Боты пользователя: {user?.first_name} {user?.last_name}
            </DialogTitle>
            <DialogDescription>
              @{user?.username || 'без username'} • ID: {user?.telegram_id}
            </DialogDescription>
          </DialogHeader>

          <UserBotsDialogContent
            isLoading={isLoading}
            bots={bots}
            selectedBotIds={selectedBotIds}
            isDeleting={isDeleting}
            onToggleBotSelection={toggleBotSelection}
            onToggleSelectAll={toggleSelectAll}
            onToggleBotStatus={handleToggleBotStatus}
            onReinstallWebhook={handleReinstallWebhook}
            onOpenSettings={openSettings}
            onDeleteBot={handleDeleteBot}
            onDeleteSelected={handleDeleteSelected}
          />
        </DialogContent>
      </Dialog>

      <BotSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        selectedBot={selectedBot}
        editPaymentUrl={editPaymentUrl}
        setEditPaymentUrl={setEditPaymentUrl}
        editPaymentEnabled={editPaymentEnabled}
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
        editTelegramToken={editTelegramToken}
        setEditTelegramToken={setEditTelegramToken}
        savingSettings={savingSettings}
        onSaveSettings={handleSaveSettings}
      />
    </>
  );
};

export default UserBotsDialog;

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import BotSettingsDialog from '@/components/bots/BotSettingsDialog';
import { useToast } from '@/hooks/use-toast';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getModerationBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Одобрен</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Отклонен</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">На модерации</Badge>;
      default:
        return <Badge variant="outline">Не отправлен</Badge>;
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Загрузка ботов...</p>
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Bot" size={48} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">У пользователя пока нет ботов</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bots.map((bot) => (
                <Card key={bot.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`} />
                        <h3 className="text-lg font-semibold">{bot.name}</h3>
                        {getModerationBadge(bot.moderationStatus)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Пользователей</p>
                          <p className="text-lg font-semibold">{bot.users}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Сообщений</p>
                          <p className="text-lg font-semibold">{bot.messages}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Шаблон</p>
                          <p className="text-sm">{bot.template}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Статус</p>
                          <p className="text-sm capitalize">{bot.status}</p>
                        </div>
                      </div>

                      {bot.moderationStatus === 'rejected' && bot.moderationReason && (
                        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <strong>Причина отклонения:</strong> {bot.moderationReason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant={bot.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleBotStatus(bot)}
                        title={bot.status === 'active' ? 'Остановить бота' : 'Запустить бота'}
                      >
                        <Icon name={bot.status === 'active' ? 'Square' : 'Play'} size={16} className="mr-1" />
                        {bot.status === 'active' ? 'Остановить' : 'Запустить'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSettings(bot)}
                        title="Редактировать настройки"
                      >
                        <Icon name="Settings" size={16} className="mr-1" />
                        Настройки
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
        onSave={handleSaveSettings}
      />
    </>
  );
};

export default UserBotsDialog;
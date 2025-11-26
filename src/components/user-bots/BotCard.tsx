import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

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

interface BotCardProps {
  bot: Bot;
  isSelected: boolean;
  onToggleSelection: (botId: string) => void;
  onToggleStatus: (bot: Bot) => void;
  onReinstallWebhook: (bot: Bot) => void;
  onOpenSettings: (bot: Bot) => void;
  onDelete: (botId: string) => void;
  isDeleting: boolean;
}

const BotCard = ({
  bot,
  isSelected,
  onToggleSelection,
  onToggleStatus,
  onReinstallWebhook,
  onOpenSettings,
  onDelete,
  isDeleting,
}: BotCardProps) => {
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
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(bot.id)}
          className="w-4 h-4 mt-1 cursor-pointer"
        />
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
          
          {bot.telegram_token && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">Telegram Token</p>
              <p className="text-sm font-mono break-all">{bot.telegram_token}</p>
            </div>
          )}

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
            onClick={() => onToggleStatus(bot)}
          >
            <Icon name={bot.status === 'active' ? 'Power' : 'Play'} size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReinstallWebhook(bot)}
          >
            <Icon name="RefreshCw" size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSettings(bot)}
          >
            <Icon name="Settings" size={16} />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(bot.id)}
            disabled={isDeleting}
          >
            <Icon name={isDeleting ? 'Loader2' : 'Trash2'} size={16} className={isDeleting ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BotCard;

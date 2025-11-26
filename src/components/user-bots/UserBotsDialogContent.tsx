import Icon from '@/components/ui/icon';
import BotSelectionToolbar from './BotSelectionToolbar';
import BotCard from './BotCard';

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

interface UserBotsDialogContentProps {
  isLoading: boolean;
  bots: Bot[];
  selectedBotIds: Set<string>;
  isDeleting: boolean;
  onToggleBotSelection: (botId: string) => void;
  onToggleSelectAll: () => void;
  onToggleBotStatus: (bot: Bot) => void;
  onReinstallWebhook: (bot: Bot) => void;
  onOpenSettings: (bot: Bot) => void;
  onDeleteBot: (botId: string) => void;
  onDeleteSelected: () => void;
}

const UserBotsDialogContent = ({
  isLoading,
  bots,
  selectedBotIds,
  isDeleting,
  onToggleBotSelection,
  onToggleSelectAll,
  onToggleBotStatus,
  onReinstallWebhook,
  onOpenSettings,
  onDeleteBot,
  onDeleteSelected,
}: UserBotsDialogContentProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Загрузка ботов...</p>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="Bot" size={48} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">У пользователя пока нет ботов</p>
      </div>
    );
  }

  return (
    <>
      <BotSelectionToolbar
        totalBots={bots.length}
        selectedCount={selectedBotIds.size}
        isDeleting={isDeleting}
        onToggleSelectAll={onToggleSelectAll}
        onDeleteSelected={onDeleteSelected}
      />
      <div className="space-y-4">
        {bots.map((bot) => (
          <BotCard
            key={bot.id}
            bot={bot}
            isSelected={selectedBotIds.has(bot.id)}
            onToggleSelection={onToggleBotSelection}
            onToggleStatus={onToggleBotStatus}
            onReinstallWebhook={onReinstallWebhook}
            onOpenSettings={onOpenSettings}
            onDelete={onDeleteBot}
            isDeleting={isDeleting}
          />
        ))}
      </div>
    </>
  );
};

export default UserBotsDialogContent;

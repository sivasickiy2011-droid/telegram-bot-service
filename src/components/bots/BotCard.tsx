import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

interface BotCardProps {
  bot: Bot;
  index: number;
  getStatusColor: (status: string) => string;
  getBotTypeLabel: (type: string) => string;
  onSettings: (bot: Bot) => void;
  onStats: (bot: Bot) => void;
  onDelete: (botId: string) => void;
  onToggleStatus: (botId: string, currentStatus: string) => void;
}

const BotCard = ({ 
  bot, 
  index, 
  getStatusColor, 
  getBotTypeLabel,
  onSettings, 
  onStats, 
  onDelete,
  onToggleStatus
}: BotCardProps) => {
  return (
    <Card
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
            <p className="text-xs text-muted-foreground">{getBotTypeLabel(bot.template)}</p>
          </div>
        </div>
        {bot.moderationStatus === 'pending' ? (
          <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
            <Icon name="Clock" size={12} />
            На проверке
          </div>
        ) : bot.moderationStatus === 'rejected' ? (
          <div className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
            <Icon name="XCircle" size={12} />
            Отклонен
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Icon 
              name="Zap" 
              size={16} 
              className={`${bot.status === 'active' ? 'text-green-500' : 'text-gray-400'} ${bot.status === 'active' ? 'animate-pulse' : ''}`}
            />
            <span className="text-xs text-muted-foreground">
              {bot.status === 'active' ? 'Активен' : 'Отключен'}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-3 mb-4">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Ссылка на бота:</p>
          <a 
            href={`https://t.me/${bot.name.toLowerCase().replace(/\s+/g, '_')}_bot`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Icon name="ExternalLink" size={12} />
            @{bot.name.toLowerCase().replace(/\s+/g, '_')}_bot
          </a>
        </div>
        
        <div className="space-y-2 text-xs">
          <p className="font-medium text-muted-foreground">Функции бота:</p>
          {bot.template === 'keys' && (
            <>
              <div className="flex items-center gap-2">
                <Icon name="QrCode" size={14} className="text-purple-500" />
                <span>Генерация QR-ключей</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Star" size={14} className="text-yellow-500" />
                <span>VIP-подписки</span>
              </div>
            </>
          )}
          {bot.template === 'shop' && (
            <>
              <div className="flex items-center gap-2">
                <Icon name="ShoppingCart" size={14} className="text-green-500" />
                <span>Каталог товаров</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Package" size={14} className="text-blue-500" />
                <span>Управление заказами</span>
              </div>
            </>
          )}
          {bot.template === 'warehouse' && (
            <>
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={14} className="text-orange-500" />
                <span>Бронирование времени</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Bell" size={14} className="text-purple-500" />
                <span>Напоминания клиентам</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Icon name="Users" size={14} className="text-blue-500" />
            <span>{bot.users} пользователей</span>
          </div>
        </div>
      </div>
      
      {bot.moderationStatus === 'rejected' && bot.moderationReason && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-medium text-red-500 mb-1">Причина отклонения:</p>
          <p className="text-xs text-red-400">{bot.moderationReason}</p>
        </div>
      )}
      
      {bot.moderationStatus === 'pending' && (
        <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            <Icon name="AlertCircle" size={12} className="inline mr-1" />
            Бот проходит модерацию администратором
          </p>
        </div>
      )}
      
      {bot.moderationStatus === 'approved' && bot.status === 'inactive' && (
        <div className="mb-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            <Icon name="Info" size={12} className="inline mr-1" />
            Бот одобрен! Для активации обратитесь к администратору
          </p>
          <p className="text-xs text-muted-foreground">
            После активации бот начнет обрабатывать сообщения согласно заданной логике
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            disabled={bot.moderationStatus === 'pending' || bot.moderationStatus === 'rejected'}
            onClick={() => onSettings(bot)}
          >
            <Icon name="Settings" size={14} className="mr-1" />
            Настройки
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            disabled={bot.moderationStatus === 'pending' || bot.moderationStatus === 'rejected'}
            onClick={() => onStats(bot)}
          >
            <Icon name="BarChart3" size={14} className="mr-1" />
            Статистика
          </Button>
        </div>
        
        {bot.moderationStatus === 'approved' && (
          <Button 
            variant="outline" 
            size="sm" 
            className={`w-full ${bot.status === 'active' ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10' : 'text-green-500 hover:text-green-600 hover:bg-green-500/10'}`}
            onClick={() => onToggleStatus(bot.id, bot.status)}
          >
            <Icon name={bot.status === 'active' ? 'Power' : 'PowerOff'} size={14} className="mr-1" />
            {bot.status === 'active' ? 'Отключить бота' : 'Включить бота'}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={() => {
            if (confirm(`Удалить бота "${bot.name}"? Это действие нельзя отменить.`)) {
              onDelete(bot.id);
            }
          }}
        >
          <Icon name="Trash2" size={14} className="mr-1" />
          Удалить бота
        </Button>
      </div>
    </Card>
  );
};

export default BotCard;
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface PendingBot {
  id: number;
  name: string;
  telegram_token: string;
  template: string;
  bot_description?: string;
  bot_logic?: string;
  bot_template?: string;
  owner_name: string;
  created_at: string;
  user_id: number;
}

interface ModerationTabProps {
  currentUser: any;
  onModerate: () => void;
}

const ModerationTab = ({ currentUser, onModerate }: ModerationTabProps) => {
  const [pendingBots, setPendingBots] = useState<PendingBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    loadPendingBots();
  }, []);

  const loadPendingBots = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://functions.poehali.dev/6ead39ca-fa16-491f-8f5e-19af81c2ccac');
      const data = await response.json();
      setPendingBots(data.bots || []);
    } catch (error) {
      console.error('Failed to load pending bots:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить боты на модерации',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (botId: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !reason.trim()) {
      toast({
        title: 'Укажите причину',
        description: 'При отклонении бота необходимо указать причину',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch('https://functions.poehali.dev/6ead39ca-fa16-491f-8f5e-19af81c2ccac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          action,
          admin_id: currentUser.id,
          reason: reason.trim() || (action === 'approve' ? 'Бот прошел проверку' : ''),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: action === 'approve' ? 'Бот одобрен' : 'Бот отклонен',
          description: data.message,
        });
        setSelectedBot(null);
        setReason('');
        loadPendingBots();
        onModerate();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обработать запрос',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (pendingBots.length === 0) {
    return (
      <Card className="p-12 glass-card text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Icon name="CheckCircle" size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">Все проверено!</h3>
        <p className="text-muted-foreground">Нет ботов, ожидающих модерации</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Модерация ботов</h2>
          <p className="text-muted-foreground">Проверьте ботов перед их запуском</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {pendingBots.length} на проверке
        </Badge>
      </div>

      <div className="grid gap-6">
        {pendingBots.map((bot) => (
          <Card key={bot.id} className="p-6 glass-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center">
                  <Icon name="Bot" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{bot.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Владелец: <span className="font-semibold">{bot.owner_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Создан: {new Date(bot.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                На модерации
              </Badge>
            </div>

            <div className="space-y-4 mb-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Тип бота</p>
                    <p className="font-semibold">{getBotTypeLabel(bot.bot_template || bot.template)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Токен</p>
                    <p className="font-mono text-sm">{bot.telegram_token.substring(0, 15)}...</p>
                  </div>
                </div>
                
                {bot.bot_description && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Описание бота</p>
                    <p className="text-sm">{bot.bot_description}</p>
                  </div>
                )}
                
                {bot.bot_logic && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Логика работы</p>
                    <div className="text-sm whitespace-pre-wrap p-3 rounded bg-background/50 border max-h-48 overflow-y-auto">
                      {bot.bot_logic}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedBot === bot.id && (
              <div className="mb-4 space-y-3 animate-slide-down">
                <Textarea
                  placeholder="Причина отклонения (обязательно при отклонении)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => handleModerate(bot.id, 'approve')}
                disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Одобрить
              </Button>
              <Button
                onClick={() => {
                  if (selectedBot === bot.id) {
                    handleModerate(bot.id, 'reject');
                  } else {
                    setSelectedBot(bot.id);
                    setReason('');
                  }
                }}
                disabled={processing}
                variant="destructive"
                className="flex-1"
              >
                <Icon name="XCircle" size={16} className="mr-2" />
                {selectedBot === bot.id ? 'Подтвердить отклонение' : 'Отклонить'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModerationTab;
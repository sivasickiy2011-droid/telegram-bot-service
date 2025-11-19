import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ApprovedBot {
  id: number;
  name: string;
  telegram_token: string;
  template: string;
  bot_description?: string;
  bot_logic?: string;
  status: 'active' | 'inactive';
  owner_username: string;
  created_at: string;
}

interface BotActivationTabProps {
  currentUser: any;
}

const BotActivationTab = ({ currentUser }: BotActivationTabProps) => {
  const [bots, setBots] = useState<ApprovedBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadApprovedBots();
  }, []);

  const loadApprovedBots = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://functions.poehali.dev/219980d4-f0af-4bfd-a046-421e59d66113');
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error('Failed to load approved bots:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить одобренных ботов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivation = async (botId: number, action: 'activate' | 'deactivate') => {
    try {
      setProcessing(botId);
      
      if (action === 'activate') {
        const qrResponse = await fetch('https://functions.poehali.dev/11492c68-8058-4d7e-a8a8-f6f82614e69e', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_id: botId,
          }),
        });

        const qrData = await qrResponse.json();
        
        if (!qrResponse.ok) {
          console.warn('QR codes generation warning:', qrData);
        }
        
        const webhookResponse = await fetch('https://functions.poehali.dev/5de84ef3-0564-49a9-95a1-05f3de4ba313', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_id: botId,
            action: 'setup',
          }),
        });

        const webhookData = await webhookResponse.json();
        
        if (!webhookResponse.ok || !webhookData.telegram_result?.ok) {
          throw new Error('Не удалось настроить webhook для бота');
        }
      }
      
      const response = await fetch('https://functions.poehali.dev/219980d4-f0af-4bfd-a046-421e59d66113', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: botId,
          action,
          admin_id: currentUser.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: action === 'activate' ? '🚀 Бот активирован!' : 'Бот деактивирован',
          description: action === 'activate' 
            ? 'Бот запущен и готов принимать сообщения в Telegram' 
            : data.message,
        });
        loadApprovedBots();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить операцию',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <Card className="p-12 glass-card text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <Icon name="CheckCircle" size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">Все боты обработаны!</h3>
        <p className="text-muted-foreground">Нет одобренных ботов, ожидающих активации</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Активация ботов</h2>
          <p className="text-muted-foreground">Управление запуском одобренных ботов</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {bots.length} одобренных
        </Badge>
      </div>

      <div className="grid gap-6">
        {bots.map((bot) => (
          <Card key={bot.id} className="p-6 glass-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  bot.status === 'active' ? 'gradient-green' : 'gradient-orange'
                }`}>
                  <Icon name="Bot" size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{bot.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Владелец: <span className="font-semibold">{bot.owner_username}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Создан: {new Date(bot.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={bot.status === 'active' 
                  ? 'text-green-500 border-green-500/30 bg-green-500/10' 
                  : 'text-orange-500 border-orange-500/30 bg-orange-500/10'
                }
              >
                {bot.status === 'active' ? '● Активен' : '○ Неактивен'}
              </Badge>
            </div>

            <div className="space-y-4 mb-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Тип бота</p>
                  <p className="font-semibold">{getBotTypeLabel(bot.template)}</p>
                </div>

                {bot.bot_description && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Описание</p>
                    <p className="text-sm">{bot.bot_description}</p>
                  </div>
                )}

                {bot.bot_logic && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Логика работы</p>
                    <div className="text-sm whitespace-pre-wrap p-3 rounded bg-background/50 border max-h-32 overflow-y-auto">
                      {bot.bot_logic}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Токен</p>
                  <p className="font-mono text-xs bg-background/50 p-2 rounded break-all">
                    {bot.telegram_token}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {bot.status === 'inactive' ? (
                <Button
                  onClick={() => handleActivation(bot.id, 'activate')}
                  disabled={processing === bot.id}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Icon name="Play" size={16} className="mr-2" />
                  {processing === bot.id ? 'Активация...' : 'Активировать бота'}
                </Button>
              ) : (
                <Button
                  onClick={() => handleActivation(bot.id, 'deactivate')}
                  disabled={processing === bot.id}
                  variant="destructive"
                  className="flex-1"
                >
                  <Icon name="Pause" size={16} className="mr-2" />
                  {processing === bot.id ? 'Остановка...' : 'Остановить бота'}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BotActivationTab;
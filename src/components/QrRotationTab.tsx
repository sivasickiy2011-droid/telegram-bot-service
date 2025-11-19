import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface BotRotationInfo {
  bot_id: number;
  bot_name: string;
  rotation_interval: string;
  last_rotation: string;
  next_rotation: string;
  time_until_rotation: string;
  rotation_due: boolean;
}

interface QrRotationTabProps {
  currentUser: any;
}

const QrRotationTab = ({ currentUser }: QrRotationTabProps) => {
  const [bots, setBots] = useState<BotRotationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState<number | null>(null);
  const [rotatingAll, setRotatingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRotationSchedule();
    const interval = setInterval(loadRotationSchedule, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadRotationSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://functions.poehali.dev/b2dc4e49-9fa9-4baa-b90b-b2d457d9ebd8');
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error('Failed to load rotation schedule:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить расписание ротации',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRotateBot = async (botId: number) => {
    try {
      setRotating(botId);
      const response = await fetch('https://functions.poehali.dev/b2dc4e49-9fa9-4baa-b90b-b2d457d9ebd8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: botId }),
      });

      const data = await response.json();

      if (response.ok) {
        const result = data.rotation_result;
        if (result.action === 'rotated') {
          toast({
            title: '✅ QR-коды обновлены',
            description: `Сброшено ${result.free_qr_reset} бесплатных ключей`,
          });
        } else {
          toast({
            title: 'Ротация не требуется',
            description: result.reason,
          });
        }
        loadRotationSchedule();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить ротацию',
        variant: 'destructive',
      });
    } finally {
      setRotating(null);
    }
  };

  const handleRotateAll = async () => {
    try {
      setRotatingAll(true);
      const response = await fetch('https://functions.poehali.dev/b2dc4e49-9fa9-4baa-b90b-b2d457d9ebd8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '🔄 Ротация завершена',
          description: `Обработано: ${data.total_processed}, обновлено: ${data.rotated}`,
        });
        loadRotationSchedule();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить ротацию',
        variant: 'destructive',
      });
    } finally {
      setRotatingAll(false);
    }
  };

  const formatTimeUntil = (timeStr: string) => {
    try {
      const match = timeStr.match(/(-?\d+)\s+day[s]?,\s+(\d+):(\d+):(\d+)/);
      if (match) {
        const days = parseInt(match[1]);
        const hours = parseInt(match[2]);
        const minutes = parseInt(match[3]);
        
        if (days < 0) return 'Требуется ротация';
        if (days > 0) return `${days}д ${hours}ч`;
        if (hours > 0) return `${hours}ч ${minutes}м`;
        return `${minutes}м`;
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Ротация QR-кодов</h2>
          <p className="text-muted-foreground mt-1">
            Автоматическое обновление QR-ключей по расписанию
          </p>
        </div>
        <Button
          className="gradient-purple border-0"
          onClick={handleRotateAll}
          disabled={rotatingAll || bots.length === 0}
        >
          {rotatingAll ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Обновление...
            </>
          ) : (
            <>
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Обновить все
            </>
          )}
        </Button>
      </div>

      {bots.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Calendar" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Нет активных расписаний</h3>
          <p className="text-muted-foreground">
            У активных ботов не настроена автоматическая ротация QR-кодов
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bots.map((bot, index) => (
            <Card
              key={bot.bot_id}
              className="p-6 glass-card hover:scale-[1.02] transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center">
                    <Icon name="RefreshCw" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{bot.bot_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Интервал: {bot.rotation_interval}
                    </p>
                  </div>
                </div>
                {bot.rotation_due ? (
                  <Badge className="gradient-red text-white border-0">
                    <Icon name="AlertCircle" size={12} className="mr-1" />
                    Требуется
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500/50 text-green-500">
                    <Icon name="CheckCircle2" size={12} className="mr-1" />
                    По расписанию
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Последняя ротация</p>
                  <p className="text-sm font-medium">
                    {new Date(bot.last_rotation).toLocaleString('ru-RU')}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Следующая ротация</p>
                  <p className="text-sm font-medium">
                    {new Date(bot.next_rotation).toLocaleString('ru-RU')}
                  </p>
                </div>

                <div className={`p-3 rounded-lg border ${
                  bot.rotation_due 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : 'bg-green-500/10 border-green-500/20'
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">Осталось времени</p>
                  <p className={`text-sm font-medium ${
                    bot.rotation_due ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {formatTimeUntil(bot.time_until_rotation)}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleRotateBot(bot.bot_id)}
                disabled={rotating === bot.bot_id}
                className="w-full"
              >
                {rotating === bot.bot_id ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  <>
                    <Icon name="RotateCw" size={16} className="mr-2" />
                    Обновить QR-коды сейчас
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1 text-blue-600 dark:text-blue-400">
              Как работает автоматическая ротация?
            </p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Система проверяет расписание каждые 15 минут</li>
              <li>При наступлении времени ротации все использованные бесплатные QR-коды сбрасываются</li>
              <li>Пользователи могут снова получить бесплатные ключи</li>
              <li>Платные (VIP) ключи не сбрасываются автоматически</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QrRotationTab;

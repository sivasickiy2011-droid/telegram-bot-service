import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const Payment = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  const botId = searchParams.get('bot_id');
  const userId = searchParams.get('user_id');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!botId || !userId || !amount) {
      setError('Неверные параметры платежа');
      setLoading(false);
      return;
    }

    loadPaymentData();
  }, [botId, userId, amount]);

  const loadPaymentData = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/fee936e7-7794-4f0a-b8f3-73e64570ada5?bot_id=${botId}`
      );
      const data = await response.json();
      
      if (data.bot) {
        setPaymentData({
          botName: data.bot.name,
          amount: parseInt(amount || '0'),
          terminalKey: data.bot.tbank_terminal_key,
          password: data.bot.tbank_password,
        });
      } else {
        setError('Бот не найден');
      }
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!paymentData) return;

    try {
      const currentUrl = window.location.origin;
      const response = await fetch('https://functions.poehali.dev/99bbc805-8eab-41cb-89c3-b0dd02989907', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminal_key: paymentData.terminalKey,
          password: paymentData.password,
          amount: paymentData.amount * 100,
          order_id: `bot_${botId}_user_${userId}_${Date.now()}`,
          description: `Оплата VIP-ключа в боте ${paymentData.botName}`,
          payment_method: 'card',
          success_url: `${currentUrl}/payment?success=true&bot_id=${botId}&user_id=${userId}`,
          fail_url: `${currentUrl}/payment?success=false&bot_id=${botId}&user_id=${userId}`,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.error || 'Ошибка создания платежа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Загрузка данных платежа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <Icon name="XCircle" size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Ошибка</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.close()} variant="outline">
            Закрыть окно
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-background to-blue-500/10 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8 glass-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <Icon name="CreditCard" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Оплата VIP-ключа</h1>
          <p className="text-muted-foreground">
            Бот: <span className="font-semibold">{paymentData?.botName}</span>
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-6 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">Сумма к оплате</p>
          <p className="text-5xl font-bold gradient-text">{paymentData?.amount} ₽</p>
        </div>

        <div className="space-y-3 mb-6">
          <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <div className="flex items-start gap-3">
              <Icon name="Shield" size={20} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-purple-600 dark:text-purple-400 mb-1">
                  Безопасная оплата
                </p>
                <p className="text-muted-foreground">
                  Платёж обрабатывается через защищённую систему T-Bank. 
                  Мы не храним данные вашей карты.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon name="Lock" size={14} />
            <span>Защищено SSL сертификатом</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full h-14 text-lg"
            onClick={handleCardPayment}
          >
            <Icon name="CreditCard" size={20} className="mr-2" />
            Оплатить картой
          </Button>

          <Button 
            variant="outline"
            className="w-full"
            onClick={() => window.close()}
          >
            Отменить
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            После успешной оплаты VIP-ключ будет автоматически отправлен вам в боте
          </p>
        </div>
      </Card>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.ready();
              window.Telegram.WebApp.expand();
            }
          `,
        }}
      />
    </div>
  );
};

export default Payment;
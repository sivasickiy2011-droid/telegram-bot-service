import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PaymentTest = () => {
  const [terminalKey, setTerminalKey] = useState('1763535470794DEMO');
  const [password, setPassword] = useState('CZq2*qpknmH5efA*');
  const [amount, setAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp' | 'tpay'>('card');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePayment = async () => {
    if (!terminalKey || !password || !amount) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://functions.poehali.dev/d3348932-2960-4d59-ab09-7708e4dac9b1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terminal_key: terminalKey,
          password: password,
          amount: amount * 100,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        if (data.payment_url) {
          setTimeout(() => {
            window.open(data.payment_url, '_blank');
          }, 500);
        }
      } else {
        const errorMsg = data.error || data.message || 'Ошибка создания платежа';
        const details = data.details ? JSON.stringify(data.details, null, 2) : '';
        setError(`${errorMsg}${details ? '\n\nДетали:\n' + details : ''}`);
        setResult(data);
      }
    } catch (err: any) {
      setError(`Ошибка соединения: ${err.message || err}`);
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-background to-blue-500/10 py-12 px-6">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
            <Icon name="TestTube2" size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Тест платёжной системы T-Bank</h1>
          <p className="text-muted-foreground">
            Проверка интеграции с платёжным шлюзом
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Settings" size={20} />
              Настройки тестирования
            </h2>

            <Card className="p-4 bg-blue-500/10 border-blue-500/20 mb-4">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                    Тестовые данные T-Bank:
                  </p>
                  <p>Terminal_id: <code className="bg-muted px-1 py-0.5 rounded">1763535470794DEMO</code></p>
                  <p>Password: <code className="bg-muted px-1 py-0.5 rounded">CZq2*qpknmH5efA*</code></p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terminal-key">Terminal Key (Terminal_id)</Label>
                <Input
                  id="terminal-key"
                  value={terminalKey}
                  onChange={(e) => setTerminalKey(e.target.value)}
                  placeholder="1763535470794DEMO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="CZq2*qpknmH5efA*"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Сумма (рубли)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 100)}
                />
              </div>

              <div className="space-y-2">
                <Label>Метод оплаты</Label>
                <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <Icon name="CreditCard" size={16} />
                        Карта (card)
                      </div>
                    </SelectItem>
                    <SelectItem value="sbp">
                      <div className="flex items-center gap-2">
                        <Icon name="Smartphone" size={16} />
                        СБП (sbp)
                      </div>
                    </SelectItem>
                    <SelectItem value="tpay">
                      <div className="flex items-center gap-2">
                        <Icon name="Wallet" size={16} />
                        TinkoffPay (tpay)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleCreatePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Создаём платёж...
                  </>
                ) : (
                  <>
                    <Icon name="Play" size={16} className="mr-2" />
                    Создать тестовый платёж
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="FileText" size={20} />
              Результат
            </h2>

            {!result && !error && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Radio" size={48} className="mx-auto mb-3 opacity-50" />
                <p>Нажмите кнопку для создания тестового платежа</p>
              </div>
            )}

            {error && (
              <Card className="p-4 bg-red-500/10 border-red-500/20">
                <div className="flex items-start gap-3">
                  <Icon name="XCircle" size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400 mb-1">
                      Ошибка
                    </p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {result && (
              <div className="space-y-4">
                <Card className="p-4 bg-green-500/10 border-green-500/20">
                  <div className="flex items-start gap-3">
                    <Icon name="CheckCircle" size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-600 dark:text-green-400 mb-1">
                        ✅ Платёж успешно создан!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Метод: <Badge variant="outline">{result.payment_method}</Badge>
                      </p>
                    </div>
                  </div>
                </Card>

                {paymentMethod === 'card' && result.payment_url && (
                  <>
                    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <Icon name="CreditCard" size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                            💳 Используйте тестовую карту:
                          </p>
                          <div className="text-xs space-y-1">
                            <p>Номер: <code className="bg-muted px-2 py-1 rounded">4000 0000 0000 0119</code></p>
                            <p>Срок: <code className="bg-muted px-2 py-1 rounded">12/30</code></p>
                            <p>CVV: <code className="bg-muted px-2 py-1 rounded">111</code></p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-2">
                      <Label>URL для оплаты:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={result.payment_url}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigator.clipboard.writeText(result.payment_url)}
                          title="Скопировать"
                        >
                          <Icon name="Copy" size={16} />
                        </Button>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => window.open(result.payment_url, '_blank')}
                      >
                        <Icon name="ExternalLink" size={16} className="mr-2" />
                        Открыть страницу оплаты
                      </Button>
                    </div>
                  </>
                )}

                {paymentMethod === 'sbp' && result.qr_code && (
                  <div className="text-center">
                    <Label className="mb-2 block">QR-код для СБП:</Label>
                    <img
                      src={result.qr_code}
                      alt="QR код оплаты"
                      className="mx-auto max-w-[250px] rounded-lg border"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Payment ID: {result.payment_id}
                    </p>
                  </div>
                )}

                {paymentMethod === 'tpay' && result.payment_url && (
                  <div className="space-y-2">
                    <Label>Ссылка TinkoffPay:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={result.payment_url}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigator.clipboard.writeText(result.payment_url)}
                        title="Скопировать"
                      >
                        <Icon name="Copy" size={16} />
                      </Button>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => window.open(result.payment_url, '_blank')}
                    >
                      <Icon name="ExternalLink" size={16} className="mr-2" />
                      Открыть TinkoffPay
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Payment ID: {result.payment_id} | Version: {result.version}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Полный ответ API:</Label>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-6 p-6 glass-card bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Icon name="BookOpen" size={18} />
            Инструкция по тестированию
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Убедитесь, что указаны тестовые данные T-Bank (Terminal_id и Password)</li>
            <li>Выберите метод оплаты (карта или СБП)</li>
            <li>Нажмите "Создать тестовый платёж"</li>
            <li>Для карты: откроется страница T-Bank, введите тестовую карту</li>
            <li>Для СБП: отсканируйте QR-код в приложении банка</li>
            <li>После успешной оплаты вы вернётесь на эту страницу</li>
          </ol>
        </Card>
      </div>
    </div>
  );
};

export default PaymentTest;
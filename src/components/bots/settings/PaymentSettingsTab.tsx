import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

interface Bot {
  id: string;
  name: string;
}

interface PaymentSettingsTabProps {
  selectedBot: Bot | null;
  editPaymentEnabled: boolean;
  setEditPaymentEnabled: (value: boolean) => void;
  editVipPrice: number;
  setEditVipPrice: (value: number) => void;
  editTbankTerminalKey: string;
  setEditTbankTerminalKey: (value: string) => void;
  editTbankPassword: string;
  setEditTbankPassword: (value: string) => void;
  editVipPromoEnabled: boolean;
  setEditVipPromoEnabled: (value: boolean) => void;
  editVipPromoStartDate: string;
  setEditVipPromoStartDate: (value: string) => void;
  editVipPromoEndDate: string;
  setEditVipPromoEndDate: (value: string) => void;
  editVipPurchaseMessage: string;
  setEditVipPurchaseMessage: (value: string) => void;
}

const PaymentSettingsTab = ({
  selectedBot,
  editPaymentEnabled,
  setEditPaymentEnabled,
  editVipPrice,
  setEditVipPrice,
  editTbankTerminalKey,
  setEditTbankTerminalKey,
  editTbankPassword,
  setEditTbankPassword,
  editVipPromoEnabled,
  setEditVipPromoEnabled,
  editVipPromoStartDate,
  setEditVipPromoStartDate,
  editVipPromoEndDate,
  setEditVipPromoEndDate,
  editVipPurchaseMessage,
  setEditVipPurchaseMessage,
}: PaymentSettingsTabProps) => {
  const [testingPayment, setTestingPayment] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string; details?: any} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp' | 'gift'>('card');
  const [giftPaymentUrl, setGiftPaymentUrl] = useState('');
  
  const handleTestPayment = async () => {
    if (!editTbankTerminalKey || !editTbankPassword) {
      setTestResult({
        success: false,
        message: 'Заполните Terminal Key и Password для тестирования'
      });
      return;
    }
    
    setTestingPayment(true);
    setTestResult(null);
    
    try {
      const currentUrl = window.location.origin;
      const response = await fetch('https://functions.poehali.dev/99bbc805-8eab-41cb-89c3-b0dd02989907', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          terminal_key: editTbankTerminalKey,
          password: editTbankPassword,
          amount: editVipPrice * 100,
          order_id: `test_${Date.now()}`,
          description: `Тест оплаты для бота ${selectedBot?.name || ''}`,
          payment_method: paymentMethod,
          success_url: `${currentUrl}/bots?test=success`,
          fail_url: `${currentUrl}/bots?test=fail`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Тестовый платёж успешно создан!',
          details: data
        });
        
        // Открываем ссылку на оплату если есть
        if (paymentMethod === 'card' && data.payment_url) {
          window.open(data.payment_url, '_blank');
        } else if (paymentMethod === 'sbp' && data.qr_image) {
          // Для СБП можно показать QR-код
        } else if (paymentMethod === 'gift' && data.gift_url) {
          window.open(data.gift_url, '_blank');
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Ошибка при создании платежа',
          details: data
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    } finally {
      setTestingPayment(false);
    }
  };

  return (
    <TabsContent value="payment" className="space-y-4 mt-4">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="edit-payment-enabled"
            checked={editPaymentEnabled}
            onCheckedChange={(checked) => setEditPaymentEnabled(checked as boolean)}
          />
          <Label htmlFor="edit-payment-enabled" className="cursor-pointer">
            Включить платные QR-коды
          </Label>
        </div>
        
        {editPaymentEnabled && (
          <div className="space-y-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="vip-price">Цена VIP-ключа (₽)</Label>
              <Input
                id="vip-price"
                type="number"
                min="0"
                value={editVipPrice}
                onChange={(e) => setEditVipPrice(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vip-purchase-message">Сообщение при покупке VIP-ключа</Label>
              <textarea
                id="vip-purchase-message"
                className="w-full min-h-[80px] p-2 border rounded-md bg-background text-sm"
                value={editVipPurchaseMessage}
                onChange={(e) => setEditVipPurchaseMessage(e.target.value)}
                placeholder="Короткое описание что даёт VIP-ключ..."
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vip-promo-enabled"
                  checked={editVipPromoEnabled}
                  onCheckedChange={(checked) => setEditVipPromoEnabled(checked as boolean)}
                />
                <Label htmlFor="vip-promo-enabled" className="cursor-pointer">
                  Указать период акции
                </Label>
              </div>
              
              {editVipPromoEnabled && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="vip-promo-start">Начало акции</Label>
                    <Input
                      id="vip-promo-start"
                      type="date"
                      value={editVipPromoStartDate}
                      onChange={(e) => setEditVipPromoStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vip-promo-end">Конец акции</Label>
                    <Input
                      id="vip-promo-end"
                      type="date"
                      value={editVipPromoEndDate}
                      onChange={(e) => setEditVipPromoEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>Метод оплаты</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('card')}
                  className="flex flex-col h-auto py-3"
                >
                  <Icon name="CreditCard" size={20} className="mb-1" />
                  <span className="text-xs">Карта</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'sbp' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('sbp')}
                  className="flex flex-col h-auto py-3"
                >
                  <Icon name="Smartphone" size={20} className="mb-1" />
                  <span className="text-xs">СБП</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'gift' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('gift')}
                  className="flex flex-col h-auto py-3"
                >
                  <Icon name="Gift" size={20} className="mb-1" />
                  <span className="text-xs">Подарок</span>
                </Button>
              </div>
            </div>
            
            {paymentMethod === 'gift' && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      <strong className="text-blue-600 dark:text-blue-400">Оплата подарком:</strong> Пользователь получает ссылку на подарок в Telegram.
                    </p>
                    <p>
                      После отправки подарка бот автоматически выдаёт VIP-ключ.
                    </p>
                  </div>
                </div>
              </Card>
            )}
            
            {paymentMethod === 'gift' ? (
              <div className="space-y-2">
                <Label htmlFor="gift-payment-url">
                  Ссылка на подарок Telegram
                </Label>
                <Input
                  id="gift-payment-url"
                  type="url"
                  placeholder="https://t.me/giftcode/..."
                  value={giftPaymentUrl}
                  onChange={(e) => setGiftPaymentUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ссылка на подарок, которую получит пользователь
                </p>
              </div>
            ) : (
              <>
                <Card className="p-4 bg-purple-500/10 border-purple-500/20 mb-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-purple-600 dark:text-purple-400 mb-2">
                        Что использовать из данных T-Bank:
                      </p>
                      <ul className="space-y-1">
                        <li>• <strong>Terminal Key:</strong> используйте <strong>Terminal_id</strong> из личного кабинета</li>
                        <li>• <strong>Password:</strong> секретный пароль от терминала (выдаётся при создании)</li>
                      </ul>
                      <p className="mt-2 text-orange-500">
                        <strong>Для теста:</strong> Terminal_id = 1763535470794DEMO, Password = CZq2*qpknmH5efA*
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="tbank-terminal-key">
                    Terminal_id (Terminal Key)
                  </Label>
                  <Input
                    id="tbank-terminal-key"
                    type="text"
                    placeholder="1763535470794DEMO (для теста)"
                    value={editTbankTerminalKey}
                    onChange={(e) => setEditTbankTerminalKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Найдите в личном кабинете T-Bank: Terminal_id
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tbank-password">
                    Password (секретный пароль терминала)
                  </Label>
                  <Input
                    id="tbank-password"
                    type="password"
                    placeholder="CZq2*qpknmH5efA* (для теста)"
                    value={editTbankPassword}
                    onChange={(e) => setEditTbankPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Пароль терминала из личного кабинета T-Bank
                  </p>
                </div>
                
                {paymentMethod === 'card' && (
                  <Card className="p-4 bg-green-500/10 border-green-500/20">
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircle" size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium text-green-600 dark:text-green-400 mb-1">
                          Платёжная страница
                        </p>
                        <p className="text-muted-foreground mb-2">
                          Будет создана на домене платформы:
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {window.location.origin}/payment?bot_id={selectedBot?.id}
                        </code>
                        <p className="text-muted-foreground mt-2">
                          T-Bank будет проверять эту страницу для одобрения платежей.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
                
                {paymentMethod === 'sbp' && (
                  <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-muted-foreground">
                        <p className="mb-2">
                          <strong className="text-blue-600 dark:text-blue-400">СБП:</strong> Система быстрых платежей.
                        </p>
                        <p>
                          Пользователь получит QR-код для оплаты через банковское приложение.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
            
            <div className="space-y-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleTestPayment}
                disabled={testingPayment || !editTbankTerminalKey || !editTbankPassword}
                className="w-full"
              >
                <Icon name={testingPayment ? "Loader2" : "TestTube2"} size={14} className={`mr-2 ${testingPayment ? 'animate-spin' : ''}`} />
                {testingPayment ? 'Проверяю...' : 'Протестировать подключение'}
              </Button>
              
              {testResult && (
                <Card className={`p-3 ${testResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`text-xs flex items-start gap-2 ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <Icon name={testResult.success ? "CheckCircle2" : "XCircle"} size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{testResult.message}</span>
                  </p>
                  {testResult.details && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                        Подробности
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
};

export default PaymentSettingsTab;
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

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
}

interface BotSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBot: Bot | null;
  editPaymentUrl: string;
  editPaymentEnabled: boolean;
  savingSettings: boolean;
  setEditPaymentUrl: (value: string) => void;
  setEditPaymentEnabled: (value: boolean) => void;
  onSave: () => void;
}

const BotSettingsDialog = ({
  open,
  onOpenChange,
  selectedBot,
  editPaymentUrl,
  editPaymentEnabled,
  savingSettings,
  setEditPaymentUrl,
  setEditPaymentEnabled,
  onSave,
}: BotSettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState('payment');
  
  const [buttonTexts, setButtonTexts] = useState({
    free_key: '🎁 Получить бесплатный ключ',
    secret_shop: '🔐 Узнать про Тайную витрину',
    buy_vip: '💎 Купить VIP-ключ',
    help: '❓ Помощь'
  });
  
  const [messageTexts, setMessageTexts] = useState({
    welcome: '🚀 Привет! Я бот POLYTOPE.\n\nЗдесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине на нашей закрытой распродаже с 21 по 23 ноября.\n\nВыберите действие:',
    free_key_success: '✅ Ваш бесплатный ключ №{code_number}\n\nПокажите этот QR-код на кассе:\n• Участвуете в розыгрыше подарка\n• Получаете право на участие в Чёрной пятнице',
    free_key_empty: '😔 Бесплатные ключи на сегодня закончились.\n\nНо вы всё ещё можете получить VIP-ключ и попасть в Тайную витрину!',
    secret_shop_info: '🔐 Тайная витрина — это эксклюзивная закрытая распродажа!\n\n📅 Даты: 21-23 ноября\n💎 Доступ: Только с VIP-ключом\n🎁 Специальные предложения и скидки до 70%\n\nVIP-ключ открывает доступ к товарам, которых нет в обычном магазине.',
    buy_vip_info: '💎 VIP-ключ дает доступ к Тайной витрине!\n\nСтоимость: 500 ₽\n\nПосле оплаты вы получите VIP QR-код с номером от 501 до 1000.',
    help: '❓ Как пользоваться ботом:\n\n🎁 Получить бесплатный ключ - выдает QR-код (номера 1-500)\n🔐 Узнать про Тайную витрину - информация о закрытой распродаже\n💎 Купить VIP-ключ - получить доступ к эксклюзивным товарам\n\nПо всем вопросам пишите в поддержку.'
  });
  
  const [tbankTerminalKey, setTbankTerminalKey] = useState('');
  const [tbankPassword, setTbankPassword] = useState('');
  const [vipPrice, setVipPrice] = useState(500);
  const [testingPayment, setTestingPayment] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string; details?: any} | null>(null);
  
  const handleTestPayment = async () => {
    if (!tbankTerminalKey || !tbankPassword) {
      setTestResult({
        success: false,
        message: 'Заполните Terminal Key и Password для тестирования'
      });
      return;
    }
    
    setTestingPayment(true);
    setTestResult(null);
    
    try {
      const response = await fetch('https://functions.poehali.dev/d3348932-2960-4d59-ab09-7708e4dac9b1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          terminal_key: tbankTerminalKey,
          password: tbankPassword,
          amount: vipPrice * 100
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Тестовый платёж успешно создан!',
          details: data
        });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки бота: {selectedBot?.name}</DialogTitle>
          <DialogDescription>
            Настройте тексты, кнопки и интеграцию с оплатой
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment">
              <Icon name="CreditCard" size={14} className="mr-2" />
              Оплата
            </TabsTrigger>
            <TabsTrigger value="texts">
              <Icon name="MessageSquare" size={14} className="mr-2" />
              Тексты
            </TabsTrigger>
            <TabsTrigger value="instructions">
              <Icon name="BookOpen" size={14} className="mr-2" />
              Инструкции
            </TabsTrigger>
          </TabsList>
          
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
                      value={vipPrice}
                      onChange={(e) => setVipPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tbank-terminal-key">
                      T-Bank Terminal Key
                    </Label>
                    <Input
                      id="tbank-terminal-key"
                      type="text"
                      placeholder="ваш_terminal_key"
                      value={tbankTerminalKey}
                      onChange={(e) => setTbankTerminalKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Получите в личном кабинете T-Bank
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tbank-password">
                      T-Bank Password
                    </Label>
                    <Input
                      id="tbank-password"
                      type="password"
                      placeholder="ваш_пароль"
                      value={tbankPassword}
                      onChange={(e) => setTbankPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Секретный пароль из личного кабинета T-Bank
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleTestPayment}
                      disabled={testingPayment || !tbankTerminalKey || !tbankPassword}
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
                            <summary className="text-xs cursor-pointer opacity-70">Подробности</summary>
                            <pre className="text-xs mt-1 p-2 bg-black/5 dark:bg-white/5 rounded overflow-auto max-h-32">
                              {JSON.stringify(testResult.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </Card>
                    )}
                    
                    <Card className="p-3 bg-blue-500/10 border-blue-500/20">
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                        <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
                        <span>После сохранения данных оплата через СБП T-Bank будет работать автоматически</span>
                      </p>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="texts" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Тексты кнопок</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="btn-free-key" className="text-xs">Кнопка "Получить бесплатный ключ"</Label>
                    <Input
                      id="btn-free-key"
                      value={buttonTexts.free_key}
                      onChange={(e) => setButtonTexts({...buttonTexts, free_key: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="btn-secret-shop" className="text-xs">Кнопка "Узнать про Тайную витрину"</Label>
                    <Input
                      id="btn-secret-shop"
                      value={buttonTexts.secret_shop}
                      onChange={(e) => setButtonTexts({...buttonTexts, secret_shop: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="btn-buy-vip" className="text-xs">Кнопка "Купить VIP-ключ"</Label>
                    <Input
                      id="btn-buy-vip"
                      value={buttonTexts.buy_vip}
                      onChange={(e) => setButtonTexts({...buttonTexts, buy_vip: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="btn-help" className="text-xs">Кнопка "Помощь"</Label>
                    <Input
                      id="btn-help"
                      value={buttonTexts.help}
                      onChange={(e) => setButtonTexts({...buttonTexts, help: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-3">Тексты сообщений</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="msg-welcome" className="text-xs">Приветственное сообщение</Label>
                    <Textarea
                      id="msg-welcome"
                      value={messageTexts.welcome}
                      onChange={(e) => setMessageTexts({...messageTexts, welcome: e.target.value})}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="msg-free-success" className="text-xs">Сообщение при выдаче бесплатного ключа</Label>
                    <Textarea
                      id="msg-free-success"
                      value={messageTexts.free_key_success}
                      onChange={(e) => setMessageTexts({...messageTexts, free_key_success: e.target.value})}
                      rows={3}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {'{code_number}'} будет заменено на номер ключа
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="msg-vip-info" className="text-xs">Сообщение при покупке VIP-ключа</Label>
                    <Textarea
                      id="msg-vip-info"
                      value={messageTexts.buy_vip_info}
                      onChange={(e) => setMessageTexts({...messageTexts, buy_vip_info: e.target.value})}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="instructions" className="space-y-4 mt-4">
            <div className="space-y-4">
              <Card className="p-4 border-blue-500/20 bg-blue-500/5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="CreditCard" size={16} className="text-blue-500" />
                  Интеграция с T-Bank (СБП)
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Шаг 1:</strong> Зарегистрируйтесь в T-Bank для бизнеса</p>
                  <p><strong>Шаг 2:</strong> Получите Terminal Key и Password в личном кабинете</p>
                  <p><strong>Шаг 3:</strong> Введите данные на вкладке "Оплата"</p>
                  <p><strong>Шаг 4:</strong> Укажите цену VIP-ключа</p>
                  <p className="pt-2"><strong>API документация:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <a 
                        href="https://developer.tbank.ru/eacq/api/sbp-pay-test" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Тестовая оплата через СБП
                      </a>
                    </li>
                    <li>
                      <a 
                        href="https://developer.tbank.ru/eacq/api/get-qr" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Формирование QR-кода оплаты
                      </a>
                    </li>
                  </ul>
                </div>
              </Card>
              
              <Card className="p-4 border-green-500/20 bg-green-500/5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="CheckCircle" size={16} className="text-green-500" />
                  Тестирование платежей
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Используйте тестовые данные для проверки интеграции:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Тестовый Terminal Key предоставляется T-Bank</li>
                    <li>Используйте песочницу для проверки оплат</li>
                    <li>После успешного теста переключите на боевой режим</li>
                  </ul>
                </div>
              </Card>
              
              <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Icon name="AlertTriangle" size={16} className="text-yellow-500" />
                  Важно
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Храните Terminal Key и Password в секрете</li>
                    <li>Не передавайте данные третьим лицам</li>
                    <li>Регулярно проверяйте статус платежей в личном кабинете</li>
                    <li>При проблемах с интеграцией обращайтесь в поддержку T-Bank</li>
                  </ul>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={savingSettings}>
            {savingSettings ? 'Сохранение...' : 'Сохранить все настройки'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotSettingsDialog;
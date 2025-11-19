import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
}

interface BotsTabProps {
  bots: Bot[];
  newBotName: string;
  newBotToken: string;
  newBotDescription: string;
  newBotLogic: string;
  newBotTemplate: string;
  qrFreeCount: number;
  qrPaidCount: number;
  qrRotationValue: number;
  qrRotationUnit: string;
  paymentEnabled: boolean;
  paymentUrl: string;
  isCreatingBot: boolean;
  setNewBotName: (value: string) => void;
  setNewBotToken: (value: string) => void;
  setNewBotDescription: (value: string) => void;
  setNewBotLogic: (value: string) => void;
  setNewBotTemplate: (value: string) => void;
  setQrFreeCount: (value: number) => void;
  setQrPaidCount: (value: number) => void;
  setQrRotationValue: (value: number) => void;
  setQrRotationUnit: (value: string) => void;
  setPaymentEnabled: (value: boolean) => void;
  setPaymentUrl: (value: string) => void;
  handleCreateBot: () => void;
  handleDeleteBot: (botId: string) => void;
  getStatusColor: (status: string) => string;
  currentUser?: any;
}

const BotsTab = ({
  bots,
  newBotName,
  newBotToken,
  newBotDescription,
  newBotLogic,
  newBotTemplate,
  qrFreeCount,
  qrPaidCount,
  qrRotationValue,
  qrRotationUnit,
  paymentEnabled,
  paymentUrl,
  isCreatingBot,
  setNewBotName,
  setNewBotToken,
  setNewBotDescription,
  setNewBotLogic,
  setNewBotTemplate,
  setQrFreeCount,
  setQrPaidCount,
  setQrRotationValue,
  setQrRotationUnit,
  setPaymentEnabled,
  setPaymentUrl,
  handleCreateBot,
  handleDeleteBot,
  getStatusColor,
  currentUser,
}: BotsTabProps) => {
  const isAdmin = currentUser?.role === 'admin';
  const canCreateBot = isAdmin || bots.length < 1;

  const getBotTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      keys: '🔑 QR-ключи + VIP-доступ',
      shop: '🛍️ Интернет-магазин',
      subscription: '💎 Подписки и контент',
      support: '💬 Поддержка клиентов',
      custom: '⚙️ Кастомная логика',
      POLYTOPE: '🔑 QR-ключи + VIP-доступ',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!isAdmin && bots.length >= 1 && (
        <Card className="p-4 bg-muted/30 border-orange-500/50">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-orange-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Базовый тариф</p>
              <p className="text-muted-foreground">
                Вы можете создать только одного бота с шаблоном POLYTOPE. Для расширенных возможностей обратитесь к администратору.
              </p>
            </div>
          </div>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Мои боты</h2>
          <p className="text-muted-foreground mt-1">Управляйте вашими Telegram-ботами</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              className="gradient-purple border-0" 
              disabled={!canCreateBot}
              title={!canCreateBot ? 'Вы достигли лимита ботов' : ''}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Создать бота
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Создать нового бота</DialogTitle>
              <DialogDescription>
                Бот будет отправлен на модерацию администратору перед запуском
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-2">
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                <Icon name="Shield" size={14} className="mt-0.5 flex-shrink-0" />
                <span>Администратор проверит бота на соответствие правилам перед активацией</span>
              </p>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bot-name">Название бота</Label>
                <Input 
                  id="bot-name" 
                  placeholder="Мой крутой бот" 
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bot-token">Telegram Bot Token</Label>
                <Input 
                  id="bot-token" 
                  placeholder="123456:ABC-DEF..." 
                  type="password"
                  value={newBotToken}
                  onChange={(e) => setNewBotToken(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bot-template">Тип бота</Label>
                <Select 
                  value={newBotTemplate} 
                  onValueChange={(value) => {
                    setNewBotTemplate(value);
                    if (value === 'keys' && !newBotLogic) {
                      setNewBotLogic('Команда /start - приветствие и главное меню\nКоманда "Получить бесплатный ключ" - выдает бесплатный QR-ключ (номера 1-500)\nКоманда "Купить VIP-ключ" - запускает процесс оплаты через Telegram Payments\nПосле оплаты - выдается VIP-ключ с доступом к Тайной витрине\nКоманда "Мои ключи" - показывает все ключи пользователя\nИнтеграция с базой данных для хранения ключей и статусов\nАвтоматическая проверка и активация QR-кодов');
                      setNewBotDescription('Бот для выдачи бесплатных и VIP ключей доступа к Тайной витрине с интеграцией QR-кодов и платежной системы');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип бота" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keys">🔑 QR-ключи + VIP-доступ (POLYTOPE)</SelectItem>
                    <SelectItem value="shop">🛍️ Интернет-магазин</SelectItem>
                    <SelectItem value="subscription">💎 Подписки и контент</SelectItem>
                    <SelectItem value="support">💬 Поддержка клиентов</SelectItem>
                    <SelectItem value="custom">⚙️ Кастомная логика</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-description">Краткое описание (что делает бот)</Label>
                <Textarea
                  id="bot-description"
                  placeholder="Например: Бот выдает бесплатные и VIP ключи доступа, управляет подписками пользователей"
                  value={newBotDescription}
                  onChange={(e) => setNewBotDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-logic">Подробная логика работы</Label>
                <Textarea
                  id="bot-logic"
                  placeholder="Опишите детально как работает бот: команды, кнопки, сценарии использования, интеграции с платежами и т.д."
                  value={newBotLogic}
                  onChange={(e) => setNewBotLogic(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Администратор будет проверять эту информацию при модерации
                </p>
              </div>
              
              {newBotTemplate === 'keys' && (
                <>
                  <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-blue-500/10 space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Icon name="Settings" size={16} />
                        Настройки QR-кодов
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="qr-free-count" className="text-xs">
                            Бесплатных QR-кодов
                          </Label>
                          <Input
                            id="qr-free-count"
                            type="number"
                            min="0"
                            value={qrFreeCount}
                            onChange={(e) => setQrFreeCount(parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="qr-paid-count" className="text-xs">
                            Платных QR-кодов
                          </Label>
                          <Input
                            id="qr-paid-count"
                            type="number"
                            min="0"
                            value={qrPaidCount}
                            onChange={(e) => setQrPaidCount(parseInt(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Label className="text-xs">Ротация QR-кодов</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={qrRotationValue}
                            onChange={(e) => setQrRotationValue(parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="h-9 flex-1"
                          />
                          <Select value={qrRotationUnit} onValueChange={setQrRotationUnit}>
                            <SelectTrigger className="h-9 flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">Никогда</SelectItem>
                              <SelectItem value="hours">Часов</SelectItem>
                              <SelectItem value="days">Дней</SelectItem>
                              <SelectItem value="weeks">Недель</SelectItem>
                              <SelectItem value="years">Лет</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Как часто QR-коды будут обновляться (0 = никогда)
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="payment-enabled"
                            checked={paymentEnabled}
                            onCheckedChange={(checked) => setPaymentEnabled(checked as boolean)}
                          />
                          <Label
                            htmlFor="payment-enabled"
                            className="text-xs font-medium cursor-pointer"
                          >
                            Включить платные QR-коды
                          </Label>
                        </div>

                        {paymentEnabled && (
                          <div className="space-y-2 pl-6">
                            <Label htmlFor="payment-url" className="text-xs">
                              Ссылка для оплаты
                            </Label>
                            <Input
                              id="payment-url"
                              type="url"
                              placeholder="https://example.com/payment"
                              value={paymentUrl}
                              onChange={(e) => setPaymentUrl(e.target.value)}
                              className="h-9"
                            />
                            <p className="text-xs text-muted-foreground">
                              Эта ссылка откроется при нажатии кнопки "Купить VIP-ключ"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                  <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Для создания бота получите токен у @BotFather в Telegram. Отправьте команду /newbot и следуйте инструкциям.</span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogTrigger asChild>
                <Button variant="outline">Отмена</Button>
              </DialogTrigger>
              <Button 
                className="gradient-purple border-0" 
                onClick={handleCreateBot}
                disabled={isCreatingBot}
              >
                {isCreatingBot ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <Card
            key={bot.id}
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
                <div className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`} />
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
                <div className="flex items-center gap-2">
                  <Icon name="QrCode" size={14} className="text-purple-500" />
                  <span>Генерация QR-ключей</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Star" size={14} className="text-yellow-500" />
                  <span>VIP-подписки</span>
                </div>
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
                  onClick={() => alert('Настройки бота будут доступны в следующей версии')}
                >
                  <Icon name="Settings" size={14} className="mr-1" />
                  Настройки
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  disabled={bot.moderationStatus === 'pending' || bot.moderationStatus === 'rejected'}
                  onClick={() => alert('Статистика бота будет доступна в следующей версии')}
                >
                  <Icon name="BarChart3" size={14} className="mr-1" />
                  Статистика
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => {
                  if (confirm(`Удалить бота "${bot.name}"? Это действие нельзя отменить.`)) {
                    handleDeleteBot(bot.id);
                  }
                }}
              >
                <Icon name="Trash2" size={14} className="mr-1" />
                Удалить бота
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BotsTab;
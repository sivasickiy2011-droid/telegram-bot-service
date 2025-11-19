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

interface CreateBotDialogProps {
  canCreateBot: boolean;
  newBotName: string;
  newBotToken: string;
  newBotDescription: string;
  newBotLogic: string;
  newBotTemplate: string;
  uniqueNumber: string;
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
  setUniqueNumber: (value: string) => void;
  setQrFreeCount: (value: number) => void;
  setQrPaidCount: (value: number) => void;
  setQrRotationValue: (value: number) => void;
  setQrRotationUnit: (value: string) => void;
  setPaymentEnabled: (value: boolean) => void;
  setPaymentUrl: (value: string) => void;
  handleCreateBot: () => void;
}

const CreateBotDialog = ({
  canCreateBot,
  newBotName,
  newBotToken,
  newBotDescription,
  newBotLogic,
  newBotTemplate,
  uniqueNumber,
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
  setUniqueNumber,
  setQrFreeCount,
  setQrPaidCount,
  setQrRotationValue,
  setQrRotationUnit,
  setPaymentEnabled,
  setPaymentUrl,
  handleCreateBot,
}: CreateBotDialogProps) => {
  return (
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
            <Label htmlFor="unique-number">Уникальный номер бота (6 цифр)</Label>
            <Input 
              id="unique-number" 
              placeholder="123456" 
              maxLength={6}
              value={uniqueNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setUniqueNumber(value);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Используется для идентификации бота в системе
            </p>
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
                <SelectItem value="keys">🔑 QR-ключи + VIP-доступ</SelectItem>
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
  );
};

export default CreateBotDialog;
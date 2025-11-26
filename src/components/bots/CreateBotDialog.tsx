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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  offerImageUrl: string;
  privacyConsentEnabled: boolean;
  privacyConsentText: string;
  secretShopText: string;
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
  setOfferImageUrl: (value: string) => void;
  setPrivacyConsentEnabled: (value: boolean) => void;
  setPrivacyConsentText: (value: string) => void;
  setSecretShopText: (value: string) => void;
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
  offerImageUrl,
  privacyConsentEnabled,
  privacyConsentText,
  secretShopText,
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
  setOfferImageUrl,
  setPrivacyConsentEnabled,
  setPrivacyConsentText,
  setSecretShopText,
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
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Создать нового бота</DialogTitle>
          <DialogDescription>
            Бот будет отправлен на модерацию администратору перед запуском
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto overflow-x-hidden pr-2 flex-1 min-h-0">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
              <Icon name="Shield" size={14} className="mt-0.5 flex-shrink-0" />
              <span>Администратор проверит бота на соответствие правилам перед активацией</span>
            </p>
          </div>
          
          <Accordion type="single" collapsible defaultValue="basic" className="space-y-2">
            <AccordionItem value="basic" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Icon name="Bot" size={16} />
                  Основная информация
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
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
                  
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="Hash" size={14} className="text-muted-foreground" />
                      <Label className="text-xs font-medium">Уникальный номер бота</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Генерируется автоматически при создании (6-значный уникальный номер)
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="type" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Icon name="Settings" size={16} />
                  Тип и описание бота
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="bot-template">Тип бота</Label>
                    <Select 
                      value={newBotTemplate} 
                      onValueChange={(value) => {
                        setNewBotTemplate(value);
                        
                        // Устанавливаем дефолтные тексты в зависимости от шаблона
                        if (value === 'keys') {
                          setNewBotDescription('Бот для выдачи бесплатных и VIP ключей доступа к Тайной витрине с интеграцией QR-кодов и платежной системы');
                          setNewBotLogic('Команда /start - приветствие и главное меню\nКоманда "Получить бесплатный ключ" - выдает бесплатный QR-ключ (номера 1-500)\nКоманда "Купить VIP-ключ" - запускает процесс оплаты через Telegram Payments\nПосле оплаты - выдается VIP-ключ с доступом к Тайной витрине\nКоманда "Мои ключи" - показывает все ключи пользователя\nИнтеграция с базой данных для хранения ключей и статусов\nАвтоматическая проверка и активация QR-кодов');
                          setSecretShopText('🔐 Тайная витрина — это эксклюзивная закрытая распродажа!\n\n📅 Даты: 21-23 ноября\n💎 Доступ: Только с VIP-ключом\n🎁 Специальные предложения и скидки до 70%\n\nVIP-ключ открывает доступ к товарам, которых нет в обычном магазине.');
                        } else if (value === 'shop') {
                          setNewBotDescription('Интернет-магазин с каталогом товаров, корзиной и оформлением заказов через Telegram');
                          setNewBotLogic('Команда /start - главное меню магазина\nКнопка "Каталог товаров" - просмотр категорий и товаров\nКнопка "Корзина" - просмотр добавленных товаров и оформление заказа\nДобавление товаров в корзину через inline-кнопки\nОформление заказа с указанием адреса и телефона\nУведомления администратору о новых заказах\nИнтеграция с базой данных для хранения товаров, категорий и заказов');
                          setSecretShopText('🛍️ Добро пожаловать в наш интернет-магазин!\n\n📦 У нас вы найдете:\n• Широкий ассортимент качественных товаров\n• Удобный каталог с категориями\n• Быстрое оформление заказа\n• Оперативная доставка\n\n💳 Принимаем оплату при получении и онлайн.\n\nВыберите товары в каталоге и добавьте в корзину!');
                        } else if (value === 'warehouse') {
                          setNewBotDescription('Система бронирования времени разгрузки товара на складе с календарем и уведомлениями');
                          setNewBotLogic('Команда /start - главное меню склада\nКнопка "Забронировать время" - выбор даты и времени для разгрузки\nКнопка "Мои бронирования" - просмотр активных броней\nКнопка "Информация" - расписание работы склада\nФорма бронирования: телефон, компания, тип ТС, описание груза\nУведомления администратору о новых бронированиях\nНапоминания за 24 часа до разгрузки\nИнтеграция с базой данных для управления расписанием и бронированиями');
                          setSecretShopText('🏭 Система бронирования склада\n\n📅 Рабочие часы: 8:00 - 18:00 (Пн-Пт)\n⏱ Длительность слота: 60 минут\n📆 Бронирование доступно на 60 дней вперед\n\n✅ Забронируйте удобное время для разгрузки заранее!\n\nПожалуйста, прибывайте вовремя. За день до разгрузки придет напоминание.');
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип бота" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keys">🔑 QR-ключи + VIP-доступ</SelectItem>
                        <SelectItem value="shop">🛍️ Интернет-магазин</SelectItem>
                        <SelectItem value="warehouse">🏭 Склад (бронирование)</SelectItem>
                        <SelectItem value="subscription" disabled>💎 Подписки и контент (В разработке)</SelectItem>
                        <SelectItem value="support" disabled>💬 Поддержка клиентов (В разработке)</SelectItem>
                        <SelectItem value="custom" disabled>⚙️ Кастомная логика (В разработке)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Реализованные шаблоны: QR-ключи, Интернет-магазин, Склад. Остальные в разработке.
                    </p>
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
                </div>
              </AccordionContent>
          </AccordionItem>
          
          {newBotTemplate === 'keys' && (
            <AccordionItem value="qr-settings" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                <div className="flex items-center gap-2">
                  <Icon name="QrCode" size={16} />
                  Настройки QR-кодов
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
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

                  <div className="space-y-2">
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

                  <div className="space-y-3">
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
            </AccordionContent>
          </AccordionItem>
          )}
          
          <AccordionItem value="additional-settings" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Icon name="Image" size={16} />
                Дополнительные настройки
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="offer-image" className="text-xs">Изображение оффера (ссылка)</Label>
                  <Input
                    id="offer-image"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={offerImageUrl}
                    onChange={(e) => setOfferImageUrl(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Картинка будет показана пользователю перед кнопками меню
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy-consent"
                      checked={privacyConsentEnabled}
                      onCheckedChange={(checked) => setPrivacyConsentEnabled(checked as boolean)}
                    />
                    <Label htmlFor="privacy-consent" className="text-xs font-medium cursor-pointer">
                      Требовать согласие на обработку персональных данных
                    </Label>
                  </div>
                  
                  {privacyConsentEnabled && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="privacy-text" className="text-xs">
                        Текст согласия
                      </Label>
                      <Textarea
                        id="privacy-text"
                        placeholder="Я согласен на обработку персональных данных"
                        value={privacyConsentText}
                        onChange={(e) => setPrivacyConsentText(e.target.value)}
                        rows={2}
                        className="text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Пользователь должен согласиться перед использованием бота
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secret-shop-text" className="text-xs">
                    Текст о Тайной витрине (кнопка "🔐 Узнать про Тайную витрину")
                  </Label>
                  <Textarea
                    id="secret-shop-text"
                    placeholder="🔐 Тайная витрина — это эксклюзивная закрытая распродажа!..."
                    value={secretShopText}
                    onChange={(e) => setSecretShopText(e.target.value)}
                    rows={4}
                    className="text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Этот текст будет показан при нажатии на кнопку "Узнать про Тайную витрину". Если не заполнено - используется текст по умолчанию.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
          
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-4">
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
              <Icon name="Info" size={14} className="mt-0.5 flex-shrink-0" />
              <span>Для создания бота получите токен у @BotFather в Telegram. Отправьте команду /newbot и следуйте инструкциям.</span>
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
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
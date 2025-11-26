import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TabsContent } from '@/components/ui/tabs';

interface TextsSettingsTabProps {
  editButtonTexts: any;
  setEditButtonTexts: (value: any) => void;
  editMessageTexts: any;
  setEditMessageTexts: (value: any) => void;
  template?: string;
}

const TextsSettingsTab = ({
  editButtonTexts,
  setEditButtonTexts,
  editMessageTexts,
  setEditMessageTexts,
  template = 'keys',
}: TextsSettingsTabProps) => {
  const isKeysTemplate = template === 'keys';
  const isShopTemplate = template === 'shop';
  const isWarehouseTemplate = template === 'warehouse';

  return (
    <TabsContent value="texts" className="space-y-4 mt-4">
      <div className="space-y-6">
        {isKeysTemplate && (
          <>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🔘</span>
                Тексты кнопок в главном меню
              </h3>
              <div className="space-y-4">
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎁</span>
                    <Label htmlFor="btn-free-key" className="text-sm font-medium">Получить бесплатный ключ</Label>
                  </div>
                  <Input
                    id="btn-free-key"
                    value={editButtonTexts?.free_key || '🎁 Получить бесплатный ключ'}
                    onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), free_key: e.target.value})}
                    placeholder="Введите текст кнопки..."
                    className="text-base"
                  />
                </div>
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔐</span>
                    <Label htmlFor="btn-secret-shop" className="text-sm font-medium">Узнать про Тайную витрину</Label>
                  </div>
                  <Input
                    id="btn-secret-shop"
                    value={editButtonTexts?.secret_shop || '🔐 Узнать про Тайную витрину'}
                    onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), secret_shop: e.target.value})}
                    placeholder="Введите текст кнопки..."
                    className="text-base"
                  />
                </div>
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💎</span>
                    <Label htmlFor="btn-buy-vip" className="text-sm font-medium">Купить VIP-ключ</Label>
                  </div>
                  <Input
                    id="btn-buy-vip"
                    value={editButtonTexts?.buy_vip || '💎 Купить VIP-ключ'}
                    onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), buy_vip: e.target.value})}
                    placeholder="Введите текст кнопки..."
                    className="text-base"
                  />
                </div>
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">❓</span>
                    <Label htmlFor="btn-help" className="text-sm font-medium">Помощь</Label>
                  </div>
                  <Input
                    id="btn-help"
                    value={editButtonTexts?.help || '❓ Помощь'}
                    onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), help: e.target.value})}
                    placeholder="Введите текст кнопки..."
                    className="text-base"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Тексты сообщений бота
              </h3>
              <div className="space-y-4">
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👋</span>
                    <Label htmlFor="msg-welcome" className="text-sm font-medium">Приветственное сообщение</Label>
                  </div>
                  <Textarea
                    id="msg-welcome"
                    value={editMessageTexts?.welcome || '🚀 Привет! Я бот для выдачи ключей доступа.\n\nЗдесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине.\n\nВыберите действие:'}
                    onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), welcome: e.target.value})}
                    rows={4}
                    placeholder="Введите приветственное сообщение..."
                    className="text-base resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Отображается при команде /start
                  </p>
                </div>
                
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎁</span>
                    <Label htmlFor="msg-free-success" className="text-sm font-medium">Выдача бесплатного ключа</Label>
                  </div>
                  <Textarea
                    id="msg-free-success"
                    value={editMessageTexts?.free_key_success || '✅ Ваш бесплатный ключ №{code_number}\n\nПокажите этот QR-код на кассе:\n• Участвуете в розыгрыше подарка\n• Получаете право на участие в Закрытой распродаже'}
                    onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), free_key_success: e.target.value})}
                    rows={4}
                    placeholder="Введите текст сообщения..."
                    className="text-base resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    <code className="bg-muted px-1.5 py-0.5 rounded">{'{code_number}'}</code> — номер ключа
                  </p>
                </div>
                
                <div className="bg-background p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">😔</span>
                    <Label htmlFor="msg-free-empty" className="text-sm font-medium">Бесплатные ключи закончились</Label>
                  </div>
                  <Textarea
                    id="msg-free-empty"
                    value={editMessageTexts?.free_key_empty || '😔 Бесплатные ключи на сегодня закончились.\n\nНо вы всё ещё можете получить VIP-ключ и попасть в Тайную витрину!'}
                    onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), free_key_empty: e.target.value})}
                    rows={3}
                    placeholder="Введите текст сообщения..."
                    className="text-base resize-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {(isShopTemplate || isWarehouseTemplate) && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">💬</span>
              Тексты сообщений бота
            </h3>
            <div className="space-y-4">
              <div className="bg-background p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👋</span>
                  <Label htmlFor="msg-welcome" className="text-sm font-medium">Приветственное сообщение</Label>
                </div>
                <Textarea
                  id="msg-welcome"
                  value={editMessageTexts?.welcome || (isShopTemplate 
                    ? '🛍 Добро пожаловать в наш магазин!\n\nЗдесь вы можете выбрать товары из каталога и оформить заказ.\n\nВыберите действие:' 
                    : '🏭 Добро пожаловать в систему бронирования склада!\n\nЗдесь вы можете забронировать время для разгрузки товара.\n\n📅 Рабочие часы: 8:00 - 18:00 (Пн-Пт)\n⏱ Длительность слота: 60 минут\n\nВыберите действие:')}
                  onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), welcome: e.target.value})}
                  rows={6}
                  placeholder="Введите приветственное сообщение..."
                  className="text-base resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Отображается при команде /start
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            💡 <strong>Совет:</strong> Используйте эмодзи для более живого общения с пользователями. 
            {isKeysTemplate && ' Переменные вида {code_number} автоматически заменяются на реальные значения.'}
          </p>
        </div>
      </div>
    </TabsContent>
  );
};

export default TextsSettingsTab;

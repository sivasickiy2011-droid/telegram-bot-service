import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TabsContent } from '@/components/ui/tabs';

interface TextsSettingsTabProps {
  editButtonTexts: any;
  setEditButtonTexts: (value: any) => void;
  editMessageTexts: any;
  setEditMessageTexts: (value: any) => void;
}

const TextsSettingsTab = ({
  editButtonTexts,
  setEditButtonTexts,
  editMessageTexts,
  setEditMessageTexts,
}: TextsSettingsTabProps) => {
  return (
    <TabsContent value="texts" className="space-y-4 mt-4">
      <div className="space-y-6">
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
                value={editMessageTexts?.welcome || '🚀 Привет! Я бот POLYTOPE.\n\nЗдесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине на нашей закрытой распродаже с 21 по 23 ноября.\n\nВыберите действие:'}
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
                value={editMessageTexts?.free_key_success || '✅ Ваш бесплатный ключ №{code_number}\n\nПокажите этот QR-код на кассе:\n• Участвуете в розыгрыше подарка\n• Получаете право на участие в Чёрной пятнице'}
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
                <span className="text-lg">🔐</span>
                <Label htmlFor="msg-secret-shop" className="text-sm font-medium">О Тайной витрине</Label>
              </div>
              <Textarea
                id="msg-secret-shop"
                value={editMessageTexts?.secret_shop || '🔐 Тайная витрина — это эксклюзивная закрытая распродажа!\n\n🎯 Что вас ждёт:\n• Уникальные товары, которых нет в общем доступе\n• Скидки до 70% на премиум-коллекции\n• Приоритетное обслуживание\n• Ограниченное количество мест\n\n💎 Доступ открывается только при покупке VIP-ключа'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), secret_shop: e.target.value})}
                rows={6}
                placeholder="Введите описание Тайной витрины..."
                className="text-base resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Показывается при нажатии на кнопку "Тайная витрина"
              </p>
            </div>
            
            <div className="bg-background p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">❓</span>
                <Label htmlFor="msg-help" className="text-sm font-medium">Помощь пользователю</Label>
              </div>
              <Textarea
                id="msg-help"
                value={editMessageTexts?.help || '❓ Помощь\n\nЕсли у вас возникли вопросы:\n• Напишите нам: @support\n• Позвоните: +7 (900) 000-00-00\n\nРабочее время: ПН-ВС, 10:00-22:00'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), help: e.target.value})}
                rows={5}
                placeholder="Введите текст помощи..."
                className="text-base resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Укажите контакты для связи
              </p>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default TextsSettingsTab;
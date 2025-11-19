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
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Тексты кнопок</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="btn-free-key" className="text-xs">Кнопка "Получить бесплатный ключ"</Label>
              <Input
                id="btn-free-key"
                value={editButtonTexts?.free_key || '🎁 Получить бесплатный ключ'}
                onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), free_key: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="btn-secret-shop" className="text-xs">Кнопка "Узнать про Тайную витрину"</Label>
              <Input
                id="btn-secret-shop"
                value={editButtonTexts?.secret_shop || '🔐 Узнать про Тайную витрину'}
                onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), secret_shop: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="btn-buy-vip" className="text-xs">Кнопка "Купить VIP-ключ"</Label>
              <Input
                id="btn-buy-vip"
                value={editButtonTexts?.buy_vip || '💎 Купить VIP-ключ'}
                onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), buy_vip: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="btn-help" className="text-xs">Кнопка "Помощь"</Label>
              <Input
                id="btn-help"
                value={editButtonTexts?.help || '❓ Помощь'}
                onChange={(e) => setEditButtonTexts({...(editButtonTexts || {}), help: e.target.value})}
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
                value={editMessageTexts?.welcome || '🚀 Привет! Я бот POLYTOPE.\n\nЗдесь вы можете получить бесплатный ключ и VIP-ключ для доступа к Тайной витрине на нашей закрытой распродаже с 21 по 23 ноября.\n\nВыберите действие:'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), welcome: e.target.value})}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="msg-free-success" className="text-xs">Сообщение при выдаче бесплатного ключа</Label>
              <Textarea
                id="msg-free-success"
                value={editMessageTexts?.free_key_success || '✅ Ваш бесплатный ключ №{code_number}\n\nПокажите этот QR-код на кассе:\n• Участвуете в розыгрыше подарка\n• Получаете право на участие в Чёрной пятнице'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), free_key_success: e.target.value})}
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
                value={editMessageTexts?.vip_info || '🌟 Информация про VIP-ключ\n\nЗа {price} рублей вы получите:\n• Доступ к Тайной витрине\n• Скидки до 50% на товары\n• Розыгрыш среди VIP-клиентов\n\nДля оплаты нажмите кнопку ниже:'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), vip_info: e.target.value})}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {'{price}'} будет заменено на цену
              </p>
            </div>
            <div>
              <Label htmlFor="msg-vip-success" className="text-xs">Сообщение при успешной оплате VIP</Label>
              <Textarea
                id="msg-vip-success"
                value={editMessageTexts?.vip_success || '🎉 Поздравляем! Вы получили VIP-ключ №{code_number}\n\nПокажите этот QR-код на кассе для доступа к Тайной витрине с эксклюзивными скидками!'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), vip_success: e.target.value})}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="msg-help" className="text-xs">Сообщение помощи</Label>
              <Textarea
                id="msg-help"
                value={editMessageTexts?.help || '❓ Помощь\n\nЕсли у вас возникли вопросы:\n• Напишите нам: @support\n• Позвоните: +7 (900) 000-00-00\n\nРабочее время: ПН-ВС, 10:00-22:00'}
                onChange={(e) => setEditMessageTexts({...(editMessageTexts || {}), help: e.target.value})}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default TextsSettingsTab;

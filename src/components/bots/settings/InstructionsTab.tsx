import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';

const InstructionsTab = () => {
  return (
    <TabsContent value="instructions" className="space-y-4 mt-4">
      <div className="space-y-4">
        <Card className="p-4 border-blue-500/20 bg-blue-500/5">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Icon name="CreditCard" size={16} className="text-blue-500" />
            Интеграция с T-Bank (СБП)
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Шаг 1:</strong> Зарегистрируйтесь в T-Bank для бизнеса</p>
            <p><strong>Шаг 2:</strong> Создайте терминал для приёма платежей</p>
            <p><strong>Шаг 3:</strong> Найдите в личном кабинете:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Terminal_id</strong> — это ваш Terminal Key (используйте в первом поле)</li>
              <li><strong>Password</strong> — секретный пароль терминала (выдаётся при создании)</li>
            </ul>
            <p><strong>Шаг 4:</strong> Введите данные на вкладке "Оплата"</p>
            <p><strong>Шаг 5:</strong> Укажите цену VIP-ключа</p>
            
            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">Тестовые данные</p>
              <p className="text-xs">Terminal_id: <code className="bg-muted px-1 py-0.5 rounded">1763535470794DEMO</code></p>
              <p className="text-xs">Password: <code className="bg-muted px-1 py-0.5 rounded">CZq2*qpknmH5efA*</code></p>
            </div>
            
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
  );
};

export default InstructionsTab;
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 glass-card">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => window.close()}
              className="mb-4"
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold">Правила использования платформы</h1>
            <p className="text-muted-foreground mt-2">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
              <p className="text-muted-foreground">
                1.1. Настоящие Правила использования платформы (далее — «Правила») регулируют порядок
                использования сервиса для создания и управления Telegram-ботами (далее — «Платформа»).
              </p>
              <p className="text-muted-foreground mt-2">
                1.2. Используя Платформу, вы подтверждаете, что полностью прочитали, поняли и согласны
                соблюдать настоящие Правила.
              </p>
              <p className="text-muted-foreground mt-2">
                1.3. Администрация Платформы оставляет за собой право вносить изменения в настоящие
                Правила в любое время без предварительного уведомления пользователей.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Регистрация и учетная запись</h2>
              <p className="text-muted-foreground">
                2.1. Для использования Платформы необходимо пройти регистрацию через Telegram Web App.
              </p>
              <p className="text-muted-foreground mt-2">
                2.2. При регистрации вы обязуетесь предоставить точную, полную и актуальную информацию
                о себе (ФИО, номер телефона, email).
              </p>
              <p className="text-muted-foreground mt-2">
                2.3. Вы несете ответственность за сохранность данных своей учетной записи и за все
                действия, совершенные под вашей учетной записью.
              </p>
              <p className="text-muted-foreground mt-2">
                2.4. Запрещается передавать доступ к своей учетной записи третьим лицам.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Использование Платформы</h2>
              <p className="text-muted-foreground">
                3.1. Платформа предоставляет инструменты для создания, настройки и управления Telegram-ботами.
              </p>
              <p className="text-muted-foreground mt-2">
                3.2. Пользователь обязуется использовать Платформу исключительно в законных целях и
                не нарушать права третьих лиц.
              </p>
              <p className="text-muted-foreground mt-2">
                3.3. Запрещается использовать Платформу для создания ботов, которые:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li>Распространяют спам, вредоносное ПО или незаконный контент</li>
                <li>Нарушают авторские права или другие права интеллектуальной собственности</li>
                <li>Содержат материалы порнографического, экстремистского или дискриминационного характера</li>
                <li>Используются для мошенничества или иных противоправных действий</li>
                <li>Нарушают правила использования Telegram</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                3.4. Созданные вами боты проходят модерацию перед активацией. Администрация оставляет
                за собой право отклонить бота без объяснения причин.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Тарифы и оплата</h2>
              <p className="text-muted-foreground">
                4.1. Базовый тариф позволяет создать одного бота с шаблоном POLYTOPE бесплатно.
              </p>
              <p className="text-muted-foreground mt-2">
                4.2. Для расширенных возможностей (несколько ботов, кастомные шаблоны) необходимо
                связаться с администрацией для обсуждения условий.
              </p>
              <p className="text-muted-foreground mt-2">
                4.3. Оплата производится в соответствии с выбранным тарифным планом.
              </p>
              <p className="text-muted-foreground mt-2">
                4.4. Возврат средств не осуществляется, за исключением случаев, предусмотренных
                законодательством РФ.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Интеллектуальная собственность</h2>
              <p className="text-muted-foreground">
                5.1. Все права на Платформу, включая программное обеспечение, дизайн, тексты и другие
                элементы, принадлежат администрации Платформы.
              </p>
              <p className="text-muted-foreground mt-2">
                5.2. Запрещается копировать, модифицировать, распространять или использовать любые
                материалы Платформы без письменного разрешения администрации.
              </p>
              <p className="text-muted-foreground mt-2">
                5.3. Контент, созданный пользователем (тексты ботов, изображения, настройки),
                остается собственностью пользователя.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Ответственность и ограничения</h2>
              <p className="text-muted-foreground">
                6.1. Платформа предоставляется «как есть», без каких-либо гарантий.
              </p>
              <p className="text-muted-foreground mt-2">
                6.2. Администрация не несет ответственности за:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li>Убытки, возникшие в результате использования или невозможности использования Платформы</li>
                <li>Действия ботов, созданных пользователями</li>
                <li>Потерю данных или сбои в работе Платформы</li>
                <li>Действия третьих лиц, включая Telegram</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                6.3. Администрация имеет право в любое время приостановить или прекратить работу
                Платформы без предварительного уведомления.
              </p>
              <p className="text-muted-foreground mt-2">
                6.4. За нарушение настоящих Правил администрация имеет право заблокировать учетную
                запись пользователя и удалить его ботов без возврата средств.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Конфиденциальность</h2>
              <p className="text-muted-foreground">
                7.1. Обработка персональных данных осуществляется в соответствии с Политикой
                конфиденциальности и законодательством РФ.
              </p>
              <p className="text-muted-foreground mt-2">
                7.2. Администрация обязуется не передавать персональные данные пользователей третьим
                лицам, за исключением случаев, предусмотренных законом.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Разрешение споров</h2>
              <p className="text-muted-foreground">
                8.1. Все споры, связанные с использованием Платформы, разрешаются путем переговоров.
              </p>
              <p className="text-muted-foreground mt-2">
                8.2. При невозможности достижения соглашения спор подлежит рассмотрению в суде по
                месту нахождения администрации Платформы.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Заключительные положения</h2>
              <p className="text-muted-foreground">
                9.1. Настоящие Правила вступают в силу с момента начала использования Платформы.
              </p>
              <p className="text-muted-foreground mt-2">
                9.2. Если какое-либо положение настоящих Правил признано недействительным, это не
                влияет на действительность остальных положений.
              </p>
              <p className="text-muted-foreground mt-2">
                9.3. По всем вопросам, связанным с использованием Платформы, обращайтесь к администрации.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Button onClick={() => window.close()} className="w-full" size="lg">
              Закрыть
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Terms;

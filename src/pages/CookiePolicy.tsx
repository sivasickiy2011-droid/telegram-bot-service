import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const CookiePolicy = () => {
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
            <h1 className="text-3xl font-bold">Политика использования cookies</h1>
            <p className="text-muted-foreground mt-2">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Что такое cookies?</h2>
              <p className="text-muted-foreground">
                1.1. Cookies (куки) — это небольшие текстовые файлы, которые сохраняются на вашем
                устройстве при посещении сайта или использовании веб-приложения.
              </p>
              <p className="text-muted-foreground mt-2">
                1.2. Cookies помогают нам улучшать работу Платформы, запоминать ваши предпочтения и
                обеспечивать безопасность.
              </p>
              <p className="text-muted-foreground mt-2">
                1.3. Cookies не содержат вирусов и не могут получить доступ к информации на вашем
                компьютере.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Какие cookies мы используем?</h2>
              
              <h3 className="text-lg font-semibold mt-4 mb-2">2.1. Необходимые cookies</h3>
              <p className="text-muted-foreground">
                Эти cookies необходимы для работы Платформы и не могут быть отключены:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Аутентификация:</strong> Сохранение вашей сессии и данных входа</li>
                <li><strong>Безопасность:</strong> Защита от несанкционированного доступа и CSRF-атак</li>
                <li><strong>Функциональность:</strong> Запоминание настроек и предпочтений</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">2.2. Аналитические cookies</h3>
              <p className="text-muted-foreground">
                Эти cookies помогают нам понять, как пользователи взаимодействуют с Платформой:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Яндекс.Метрика:</strong> Сбор статистики посещаемости и поведения пользователей</li>
                <li><strong>Отслеживание ошибок:</strong> Помогает выявлять и исправлять технические проблемы</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">2.3. Функциональные cookies</h3>
              <p className="text-muted-foreground">
                Эти cookies запоминают ваши выборы для улучшения пользовательского опыта:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Язык интерфейса:</strong> Запоминание выбранного языка</li>
                <li><strong>Тема оформления:</strong> Сохранение предпочтений темной/светлой темы</li>
                <li><strong>Настройки отображения:</strong> Запоминание параметров интерфейса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Конкретные cookies, которые мы используем</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">telegram_user</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Назначение:</strong> Хранение данных авторизованного пользователя Telegram
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Срок действия:</strong> До выхода из системы
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Тип:</strong> Необходимый
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">_ym_uid, _ym_d, _ym_isad</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Назначение:</strong> Яндекс.Метрика — сбор статистики
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Срок действия:</strong> До 1 года
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Тип:</strong> Аналитический
                  </p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-semibold">theme_preference</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Назначение:</strong> Сохранение выбора темы оформления
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Срок действия:</strong> 1 год
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Тип:</strong> Функциональный
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Как управлять cookies?</h2>
              <p className="text-muted-foreground">
                4.1. Большинство браузеров автоматически принимают cookies, но вы можете изменить
                настройки браузера для их блокировки.
              </p>
              <p className="text-muted-foreground mt-2">
                4.2. Обратите внимание, что отключение необходимых cookies может нарушить работу
                Платформы.
              </p>
              <p className="text-muted-foreground mt-2">
                4.3. Инструкции по управлению cookies в популярных браузерах:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Google Chrome:</strong> Настройки → Конфиденциальность и безопасность → Файлы cookie</li>
                <li><strong>Mozilla Firefox:</strong> Настройки → Приватность и защита → Куки и данные сайтов</li>
                <li><strong>Safari:</strong> Настройки → Конфиденциальность → Управлять данными веб-сайта</li>
                <li><strong>Microsoft Edge:</strong> Настройки → Файлы cookie и разрешения сайтов</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Сторонние cookies</h2>
              <p className="text-muted-foreground">
                5.1. Мы используем сервисы третьих сторон, которые могут устанавливать собственные cookies:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Яндекс.Метрика:</strong> Для аналитики и отслеживания посещений</li>
                <li><strong>Telegram Web App:</strong> Для авторизации через Telegram</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                5.2. Мы не контролируем cookies третьих сторон. Ознакомьтесь с их политикой
                конфиденциальности для получения дополнительной информации.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Безопасность cookies</h2>
              <p className="text-muted-foreground">
                6.1. Мы принимаем разумные меры для защиты cookies от несанкционированного доступа.
              </p>
              <p className="text-muted-foreground mt-2">
                6.2. Cookies с конфиденциальной информацией (например, токены сессий) шифруются.
              </p>
              <p className="text-muted-foreground mt-2">
                6.3. Мы используем защиту от CSRF-атак и другие меры безопасности.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Согласие на использование cookies</h2>
              <p className="text-muted-foreground">
                7.1. Продолжая использовать Платформу, вы соглашаетесь с использованием cookies в
                соответствии с настоящей Политикой.
              </p>
              <p className="text-muted-foreground mt-2">
                7.2. Вы можете в любое время отозвать согласие, удалив cookies в настройках браузера
                и прекратив использование Платформы.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Изменения в Политике</h2>
              <p className="text-muted-foreground">
                8.1. Мы оставляем за собой право изменять настоящую Политику в любое время.
              </p>
              <p className="text-muted-foreground mt-2">
                8.2. Об изменениях мы будем уведомлять путем размещения обновленной версии на сайте.
              </p>
              <p className="text-muted-foreground mt-2">
                8.3. Дата последнего обновления указана в начале документа.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Контакты</h2>
              <p className="text-muted-foreground">
                9.1. Если у вас есть вопросы по использованию cookies, свяжитесь с нами через
                службу поддержки Платформы.
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

export default CookiePolicy;

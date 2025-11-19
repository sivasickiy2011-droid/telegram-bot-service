import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import ChatHeader from '@/components/warehouse-bot/ChatHeader';
import ChatMessage from '@/components/warehouse-bot/ChatMessage';
import ChatInput from '@/components/warehouse-bot/ChatInput';
import { useWarehouseBot } from '@/components/warehouse-bot/useWarehouseBot';

const WarehouseBotDemo = () => {
  const {
    messages,
    inputValue,
    messagesEndRef,
    setInputValue,
    handleKeyboardButton,
    handleInput
  } = useWarehouseBot();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/10 via-background to-green-500/10 py-12 px-6">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Badge className="mb-4" variant="outline">
            <Icon name="MessageSquare" size={14} className="mr-1" />
            Демо Telegram-бота
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Бот "Склад" - Бронирование разгрузки</h1>
          <p className="text-sm text-muted-foreground">
            Так будет выглядеть бот в Telegram для ваших клиентов
          </p>
        </div>

        <Card className="glass-card overflow-hidden">
          <ChatHeader />

          <div className="h-[500px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onKeyboardClick={handleKeyboardButton}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleInput}
          />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4 glass-card bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Это демонстрация интерфейса бота
                </p>
                <p className="text-muted-foreground">
                  В реальном боте пользователи будут взаимодействовать через Telegram. 
                  Все бронирования сохраняются в базе данных и доступны для управления.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 glass-card bg-green-500/10 border-green-500/20">
            <div className="flex items-start gap-3">
              <Icon name="Monitor" size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm flex-1">
                <p className="font-medium text-green-600 dark:text-green-400 mb-2">
                  Доступна веб-версия
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open('/warehouse', '_blank')}
                >
                  <Icon name="ExternalLink" size={14} className="mr-1" />
                  Открыть календарь бронирования
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WarehouseBotDemo;

import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text?: string;
  keyboard?: Array<string[]>;
  calendar?: boolean;
  timeSlots?: string[];
  bookings?: any[];
}

interface ChatMessageProps {
  message: Message;
  onKeyboardClick: (text: string) => void;
}

const ChatMessage = ({ message, onKeyboardClick }: ChatMessageProps) => {
  return (
    <div
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          message.type === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-gray-800 border'
        }`}
      >
        {message.text && (
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        )}
        
        {message.keyboard && (
          <div className="mt-2 space-y-1">
            {message.keyboard.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((button, btnIndex) => (
                  <Button
                    key={btnIndex}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onKeyboardClick(button)}
                  >
                    {button}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

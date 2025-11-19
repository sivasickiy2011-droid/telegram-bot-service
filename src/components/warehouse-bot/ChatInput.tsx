import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const ChatInput = ({ value, onChange, onSubmit }: ChatInputProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2 bg-white dark:bg-gray-950">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите сообщение..."
        className="flex-1"
      />
      <Button type="submit" size="icon">
        <Icon name="Send" size={18} />
      </Button>
    </form>
  );
};

export default ChatInput;

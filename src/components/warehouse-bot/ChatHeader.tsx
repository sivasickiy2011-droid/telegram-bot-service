import Icon from '@/components/ui/icon';

const ChatHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Icon name="Warehouse" size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-white font-semibold">Бот "Склад"</h3>
        <p className="text-xs text-blue-100">онлайн</p>
      </div>
    </div>
  );
};

export default ChatHeader;

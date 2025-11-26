import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BotSelectionToolbarProps {
  totalBots: number;
  selectedCount: number;
  isDeleting: boolean;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
}

const BotSelectionToolbar = ({
  totalBots,
  selectedCount,
  isDeleting,
  onToggleSelectAll,
  onDeleteSelected,
}: BotSelectionToolbarProps) => {
  if (totalBots === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={selectedCount === totalBots}
          onChange={onToggleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
        <span className="text-sm text-muted-foreground">
          {selectedCount > 0 ? `Выбрано: ${selectedCount}` : 'Выбрать всех'}
        </span>
      </div>
      {selectedCount > 0 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
          disabled={isDeleting}
        >
          <Icon name={isDeleting ? 'Loader2' : 'Trash2'} size={16} className={isDeleting ? 'animate-spin' : ''} />
          <span className="ml-2">Удалить выбранные</span>
        </Button>
      )}
    </div>
  );
};

export default BotSelectionToolbar;

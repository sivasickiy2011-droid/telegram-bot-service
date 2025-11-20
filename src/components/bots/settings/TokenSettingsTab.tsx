import { TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface TokenSettingsTabProps {
  editTelegramToken: string;
  setEditTelegramToken: (value: string) => void;
}

const TokenSettingsTab = ({ editTelegramToken, setEditTelegramToken }: TokenSettingsTabProps) => {
  return (
    <TabsContent value="token" className="space-y-4 mt-4">
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-start gap-3 mb-4">
          <Icon name="AlertCircle" size={20} className="text-orange-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold mb-1">Важно!</h4>
            <p className="text-sm text-muted-foreground">
              Изменение токена бота может привести к его остановке. После сохранения нового токена необходимо перезапустить бота.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telegram-token">Telegram Bot Token</Label>
        <Input
          id="telegram-token"
          type="text"
          placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
          value={editTelegramToken}
          onChange={(e) => setEditTelegramToken(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Токен можно получить у @BotFather в Telegram
        </p>
      </div>
    </TabsContent>
  );
};

export default TokenSettingsTab;

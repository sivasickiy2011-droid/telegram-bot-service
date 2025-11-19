import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
  payment_url?: string;
  payment_enabled?: boolean;
  qr_free_count?: number;
  qr_paid_count?: number;
  qr_rotation_value?: number;
  qr_rotation_unit?: string;
}

interface BotSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBot: Bot | null;
  editPaymentUrl: string;
  editPaymentEnabled: boolean;
  savingSettings: boolean;
  setEditPaymentUrl: (value: string) => void;
  setEditPaymentEnabled: (value: boolean) => void;
  onSave: () => void;
}

const BotSettingsDialog = ({
  open,
  onOpenChange,
  selectedBot,
  editPaymentUrl,
  editPaymentEnabled,
  savingSettings,
  setEditPaymentUrl,
  setEditPaymentEnabled,
  onSave,
}: BotSettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки бота: {selectedBot?.name}</DialogTitle>
          <DialogDescription>
            Настройте платежную ссылку для VIP-ключей
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-payment-enabled"
                checked={editPaymentEnabled}
                onCheckedChange={(checked) => setEditPaymentEnabled(checked as boolean)}
              />
              <Label htmlFor="edit-payment-enabled" className="cursor-pointer">
                Включить платные QR-коды
              </Label>
            </div>
            
            {editPaymentEnabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="edit-payment-url">
                  Платежная ссылка Т-банк
                </Label>
                <Input
                  id="edit-payment-url"
                  type="url"
                  placeholder="https://www.tbank.ru/rm/..."
                  value={editPaymentUrl}
                  onChange={(e) => setEditPaymentUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Эта ссылка откроется при нажатии кнопки "Купить VIP-ключ"
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={savingSettings}>
            {savingSettings ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotSettingsDialog;

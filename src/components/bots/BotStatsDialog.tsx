import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportToExcel, exportToCSV } from '@/lib/exportStats';
import { useToast } from '@/hooks/use-toast';

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

interface BotStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBot: Bot | null;
  botStats: any;
  loadingStats: boolean;
}

const BotStatsDialog = ({
  open,
  onOpenChange,
  selectedBot,
  botStats,
  loadingStats,
}: BotStatsDialogProps) => {
  const { toast } = useToast();

  const handleExportExcel = () => {
    if (!botStats) return;
    
    try {
      exportToExcel(botStats);
      toast({
        title: 'Экспорт выполнен',
        description: 'Статистика экспортирована в Excel'
      });
    } catch (error) {
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive'
      });
    }
  };

  const handleExportCSV = () => {
    if (!botStats) return;
    
    try {
      exportToCSV(botStats);
      toast({
        title: 'Экспорт выполнен',
        description: 'Статистика экспортирована в CSV'
      });
    } catch (error) {
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Статистика бота: {selectedBot?.name}</DialogTitle>
          <DialogDescription>
            Детальная информация о работе бота
          </DialogDescription>
        </DialogHeader>
        
        {loadingStats ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка статистики...</p>
          </div>
        ) : botStats ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Icon name="Users" size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{botStats.total_users}</p>
                    <p className="text-xs text-muted-foreground">Пользователей</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Icon name="MessageSquare" size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{botStats.total_messages}</p>
                    <p className="text-xs text-muted-foreground">Сообщений</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon name="QrCode" size={16} />
                QR-коды
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Всего создано:</span>
                  <span className="font-medium">{botStats.qr_codes.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Использовано:</span>
                  <span className="font-medium text-green-600">{botStats.qr_codes.used}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доступно:</span>
                  <span className="font-medium text-blue-600">{botStats.qr_codes.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VIP кодов:</span>
                  <span className="font-medium text-purple-600">{botStats.qr_codes.vip_total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Бесплатных:</span>
                  <span className="font-medium">{botStats.qr_codes.free_total}</span>
                </div>
              </div>
            </div>
            
            {botStats.payment_enabled && (
              <div className="border rounded-lg p-4 bg-green-500/5">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Icon name="CreditCard" size={16} />
                  Платежи
                </h3>
                <p className="text-xs text-muted-foreground mb-2">Платежная ссылка:</p>
                <a 
                  href={botStats.payment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {botStats.payment_url}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Icon name="AlertCircle" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Не удалось загрузить статистику</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {botStats && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportExcel}
                  className="gap-2"
                >
                  <Icon name="FileSpreadsheet" size={16} />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportCSV}
                  className="gap-2"
                >
                  <Icon name="FileText" size={16} />
                  CSV
                </Button>
              </>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BotStatsDialog;
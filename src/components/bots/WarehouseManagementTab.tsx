import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface WarehouseSchedule {
  bot_id: number;
  work_start_time: string;
  work_end_time: string;
  slot_duration_minutes: number;
  max_slots_per_day: number;
  work_days: string;
}

interface Booking {
  id: number;
  telegram_user_id: number;
  telegram_username: string;
  user_phone: string;
  user_company: string;
  booking_date: string;
  booking_time: string;
  vehicle_type: string;
  cargo_description: string;
  status: string;
  created_at: string;
}

interface WarehouseManagementTabProps {
  botId: string;
}

const WAREHOUSE_API_URL = 'https://functions.poehali.dev/caa00603-38de-4bca-ae3e-b1b825d16caa';

const WarehouseManagementTab = ({ botId }: WarehouseManagementTabProps) => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<WarehouseSchedule>({
    bot_id: parseInt(botId),
    work_start_time: '08:00',
    work_end_time: '18:00',
    slot_duration_minutes: 60,
    max_slots_per_day: 10,
    work_days: '1,2,3,4,5',
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const workDaysOptions = [
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
    { value: 7, label: 'Вс' },
  ];

  const loadSchedule = async () => {
    try {
      const response = await fetch(`${WAREHOUSE_API_URL}?bot_id=${botId}&action=schedule`);
      const data = await response.json();
      if (data.schedule) {
        const sched = data.schedule;
        setSchedule({
          bot_id: parseInt(botId),
          work_start_time: sched.work_start_time?.substring(0, 5) || '08:00',
          work_end_time: sched.work_end_time?.substring(0, 5) || '18:00',
          slot_duration_minutes: sched.slot_duration_minutes || 60,
          max_slots_per_day: sched.max_slots_per_day || 10,
          work_days: sched.work_days || '1,2,3,4,5',
        });
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const today = new Date();
      const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = twoWeeksLater.toISOString().split('T')[0];
      
      const response = await fetch(
        `${WAREHOUSE_API_URL}?bot_id=${botId}&action=bookings&date_from=${dateFrom}&date_to=${dateTo}`
      );
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  useEffect(() => {
    loadSchedule();
    loadBookings();
  }, [botId]);

  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch(WAREHOUSE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: parseInt(botId),
          work_start_time: `${schedule.work_start_time}:00`,
          work_end_time: `${schedule.work_end_time}:00`,
          slot_duration_minutes: schedule.slot_duration_minutes,
          max_slots_per_day: schedule.max_slots_per_day,
          work_days: schedule.work_days,
        }),
      });

      if (response.ok) {
        toast({ title: 'Настройки склада сохранены' });
        loadSchedule();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const response = await fetch(WAREHOUSE_API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      if (response.ok) {
        toast({ title: 'Бронирование отменено' });
        loadBookings();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось отменить', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отменить', variant: 'destructive' });
    }
  };

  const handleWorkDayToggle = (day: number) => {
    const days = schedule.work_days.split(',').map((d) => parseInt(d));
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);
    setSchedule({ ...schedule, work_days: newDays.join(',') });
  };

  const isWorkDay = (day: number) => {
    return schedule.work_days.split(',').map((d) => parseInt(d)).includes(day);
  };

  return (
    <TabsContent value="warehouse" className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Управление складом</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Settings */}
        <Card className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Settings" size={16} />
            Настройки расписания
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Время начала работы</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={schedule.work_start_time}
                  onChange={(e) => setSchedule({ ...schedule, work_start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Время окончания</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={schedule.work_end_time}
                  onChange={(e) => setSchedule({ ...schedule, work_end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slot-duration">Длительность слота (минуты)</Label>
              <Input
                id="slot-duration"
                type="number"
                min="15"
                step="15"
                value={schedule.slot_duration_minutes}
                onChange={(e) =>
                  setSchedule({ ...schedule, slot_duration_minutes: parseInt(e.target.value) || 60 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Рабочие дни</Label>
              <div className="flex flex-wrap gap-2">
                {workDaysOptions.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={isWorkDay(day.value)}
                      onCheckedChange={() => handleWorkDayToggle(day.value)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="cursor-pointer text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveSchedule} disabled={loading} className="w-full">
              <Icon name={loading ? 'Loader2' : 'Save'} size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </Card>

        {/* Bookings List */}
        <Card className="p-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Icon name="Calendar" size={16} />
            Ближайшие бронирования ({bookings.filter((b) => b.status === 'active').length})
          </h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {bookings
              .filter((b) => b.status === 'active')
              .map((booking) => (
                <div key={booking.id} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        📅 {new Date(booking.booking_date).toLocaleDateString('ru-RU')} в{' '}
                        {booking.booking_time.substring(0, 5)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        🏢 {booking.user_company}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        📱 {booking.user_phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🚚 {booking.vehicle_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        📦 {booking.cargo_description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            {bookings.filter((b) => b.status === 'active').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет активных бронирований на ближайшие 2 недели
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1 text-blue-600 dark:text-blue-400">
                Как работает бронирование склада
              </p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Пользователи выбирают дату и время из доступных слотов</li>
                <li>Занятые слоты автоматически скрываются</li>
                <li>Прошедшие даты недоступны для бронирования</li>
                <li>Пользователи могут отменить бронь из бота</li>
                <li>Администратор может отменить любую бронь</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="flex items-start gap-3">
            <Icon name="Bell" size={20} className="text-green-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1 text-green-600 dark:text-green-400">
                Система уведомлений
              </p>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>При создании брони:</strong> администраторы получают уведомление с данными клиента</li>
                <li><strong>При отмене:</strong> администраторы узнают об отмене бронирования</li>
                <li><strong>За 24 часа до разгрузки:</strong> клиент и администраторы получают напоминание</li>
                <li>Все уведомления содержат полную информацию о бронировании</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </TabsContent>
  );
};

export default WarehouseManagementTab;
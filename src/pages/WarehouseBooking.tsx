import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Booking {
  id: number;
  booking_date: string;
  booking_time: string;
  user_phone: string;
  user_company: string;
  vehicle_type: string;
  cargo_description: string;
  status: string;
  created_at: string;
}

const API_URL = 'https://functions.poehali.dev/e51fcc06-65c7-473d-a340-2d67fea6ea2d';

const WarehouseBooking = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    telegram_user_id: Date.now(),
    telegram_username: 'demo_user',
    user_phone: '',
    user_company: '',
    vehicle_type: 'Газель',
    cargo_description: '',
    bot_id: 1
  });

  const vehicleTypes = ['Газель', 'Фургон', 'Фура', 'Манипулятор', 'Контейнер'];

  useEffect(() => {
    loadAvailableSlots();
  }, [date]);

  useEffect(() => {
    loadUserBookings();
  }, []);

  const loadAvailableSlots = async () => {
    if (!date) return;

    const today = startOfDay(new Date());
    if (isBefore(date, today)) {
      setAvailableSlots([]);
      return;
    }

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(
        `${API_URL}?action=available&date=${dateStr}&bot_id=${formData.bot_id}`
      );
      const data = await response.json();

      if (data.success) {
        const currentDate = new Date();
        const selectedDate = startOfDay(date);
        const isToday = selectedDate.getTime() === startOfDay(currentDate).getTime();

        let slots = data.available_slots;

        if (isToday) {
          const currentHour = currentDate.getHours();
          const currentMinute = currentDate.getMinutes();
          slots = slots.filter((slot: string) => {
            const [hour, minute] = slot.split(':').map(Number);
            return hour > currentHour || (hour === currentHour && minute > currentMinute);
          });
        }

        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const loadUserBookings = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch(
        `${API_URL}?action=list&user_id=${formData.telegram_user_id}&date_from=${today}&status=active`
      );
      const data = await response.json();

      if (data.success) {
        setUserBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleCreateBooking = async () => {
    if (!date || !selectedTime) {
      toast({
        title: 'Ошибка',
        description: 'Выберите дату и время',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.user_phone || !formData.user_company) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          booking_date: format(date, 'yyyy-MM-dd'),
          booking_time: selectedTime
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно!',
          description: 'Время разгрузки забронировано'
        });

        setSelectedTime('');
        setFormData({
          ...formData,
          user_phone: '',
          user_company: '',
          cargo_description: ''
        });

        await loadAvailableSlots();
        await loadUserBookings();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать бронирование',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;

    try {
      const response = await fetch(`${API_URL}?id=${bookingId}&reason=Отменено пользователем`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Отменено',
          description: 'Бронирование отменено'
        });

        await loadUserBookings();
        await loadAvailableSlots();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отменить бронирование',
        variant: 'destructive'
      });
    }
  };

  const isPastDate = (checkDate: Date) => {
    return isBefore(checkDate, startOfDay(new Date()));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500/10 via-background to-green-500/10 py-12 px-6">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 mb-4">
            <Icon name="Warehouse" size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Бронирование времени разгрузки</h1>
          <p className="text-muted-foreground">
            Забронируйте удобное время для разгрузки товара на складе
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              Выберите дату и время
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Дата разгрузки</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={ru}
                  disabled={isPastDate}
                  className="rounded-md border w-full"
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                />
              </div>

              {date && !isPastDate(date) && (
                <div>
                  <Label className="mb-2 block">
                    Доступное время ({format(date, 'd MMMM yyyy', { locale: ru })})
                  </Label>
                  
                  {availableSlots.length === 0 ? (
                    <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Icon name="AlertCircle" size={18} />
                        <span className="text-sm">На эту дату нет свободных слотов</span>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="FileText" size={20} />
              Данные для бронирования
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  placeholder="+7 (900) 123-45-67"
                  value={formData.user_phone}
                  onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Компания *</Label>
                <Input
                  id="company"
                  placeholder="ООО Компания"
                  value={formData.user_company}
                  onChange={(e) => setFormData({ ...formData, user_company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle">Тип транспорта</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(val) => setFormData({ ...formData, vehicle_type: val })}
                >
                  <SelectTrigger id="vehicle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Описание груза</Label>
                <Textarea
                  id="cargo"
                  placeholder="Краткое описание груза..."
                  rows={3}
                  value={formData.cargo_description}
                  onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateBooking}
                disabled={loading || !selectedTime || !date}
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Бронируем...
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={16} className="mr-2" />
                    Забронировать время
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {userBookings.length > 0 && (
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Clock" size={20} />
              Мои бронирования
            </h2>

            <div className="space-y-3">
              {userBookings.map((booking) => (
                <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
                        <Icon name="Truck" size={24} className="text-blue-500" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru })}
                          </span>
                          <Badge variant="outline">{booking.booking_time}</Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <Icon name="Building2" size={14} className="inline mr-1" />
                            {booking.user_company}
                          </p>
                          <p>
                            <Icon name="Truck" size={14} className="inline mr-1" />
                            {booking.vehicle_type}
                          </p>
                          {booking.cargo_description && (
                            <p>
                              <Icon name="Package" size={14} className="inline mr-1" />
                              {booking.cargo_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      <Icon name="Trash2" size={14} className="mr-1" />
                      Отменить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        <Card className="mt-6 p-6 glass-card bg-gradient-to-r from-blue-500/10 to-green-500/10">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Icon name="Info" size={18} />
            Информация о бронировании
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Время разгрузки можно забронировать только на будущие даты</li>
            <li>Одно время может быть забронировано только один раз</li>
            <li>Длительность одного слота — 1 час</li>
            <li>Склад работает с 8:00 до 18:00</li>
            <li>Вы можете отменить бронирование в любое время</li>
            <li>После отмены время снова становится доступным для других</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default WarehouseBooking;

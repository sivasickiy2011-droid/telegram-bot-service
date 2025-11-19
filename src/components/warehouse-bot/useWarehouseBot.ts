import { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  type: 'bot' | 'user';
  text?: string;
  keyboard?: Array<string[]>;
  calendar?: boolean;
  timeSlots?: string[];
  bookings?: any[];
}

const API_URL = 'https://functions.poehali.dev/e51fcc06-65c7-473d-a340-2d67fea6ea2d';

export const useWarehouseBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userId] = useState(Math.floor(Math.random() * 1000000));
  const [currentStep, setCurrentStep] = useState('menu');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [currentBookings, setCurrentBookings] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    phone: '',
    company: '',
    vehicle: 'Газель',
    cargo: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    addBotMessage(
      'Добро пожаловать! 🏭\n\nЯ помогу вам забронировать время для разгрузки на складе.',
      [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]
    );
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text: string, keyboard?: Array<string[]>, options?: any) => {
    const newMessage: Message = {
      id: Date.now(),
      type: 'bot',
      text,
      keyboard,
      ...options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      type: 'user',
      text
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleKeyboardButton = async (text: string) => {
    addUserMessage(text);

    if (text === '📅 Забронировать время') {
      setCurrentStep('select_date');
      const dates = [];
      for (let i = 0; i < 14; i++) {
        const date = addDays(new Date(), i);
        dates.push(format(date, 'd MMM', { locale: ru }));
      }
      
      const dateButtons = [];
      for (let i = 0; i < dates.length; i += 3) {
        dateButtons.push(dates.slice(i, i + 3));
      }
      dateButtons.push(['❌ Отмена']);
      
      addBotMessage(
        'Выберите дату разгрузки:',
        dateButtons
      );
    } else if (text === '📋 Мои бронирования') {
      await loadUserBookings();
    } else if (text === 'ℹ️ Информация') {
      addBotMessage(
        '📋 Информация о бронировании:\n\n' +
        '⏰ Рабочие часы: 8:00 - 18:00\n' +
        '📅 Длительность слота: 60 минут\n' +
        '🔄 Рабочие дни: Пн-Пт\n' +
        '❌ Вы можете отменить бронь в любое время\n\n' +
        'После отмены время снова станет доступным для других.',
        [['📅 Забронировать время', '📋 Мои бронирования']]
      );
    } else if (text === '❌ Отмена' || text === '🔙 Назад') {
      setCurrentStep('menu');
      addBotMessage(
        'Главное меню:',
        [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]
      );
    } else if (text === '📅 Забронировать ещё') {
      setCurrentStep('select_date');
      const dates = [];
      for (let i = 0; i < 14; i++) {
        const date = addDays(new Date(), i);
        dates.push(format(date, 'd MMM', { locale: ru }));
      }
      
      const dateButtons = [];
      for (let i = 0; i < dates.length; i += 3) {
        dateButtons.push(dates.slice(i, i + 3));
      }
      dateButtons.push(['❌ Отмена']);
      
      addBotMessage(
        'Выберите дату разгрузки:',
        dateButtons
      );
    } else if (text.startsWith('❌ Отменить #')) {
      const index = parseInt(text.replace('❌ Отменить #', '')) - 1;
      if (currentBookings[index]) {
        await handleCancelBooking(currentBookings[index].id);
      }
    } else if (currentStep === 'select_date') {
      await handleDateSelection(text);
    } else if (currentStep === 'select_time') {
      handleTimeSelection(text);
    } else if (currentStep === 'enter_phone') {
      handlePhoneInput(text);
    } else if (currentStep === 'enter_company') {
      handleCompanyInput(text);
    } else if (currentStep === 'select_vehicle') {
      handleVehicleSelection(text);
    } else if (currentStep === 'enter_cargo') {
      await handleCargoInput(text);
    }
  };

  const handleDateSelection = async (dateText: string) => {
    if (dateText === '❌ Отмена') {
      setCurrentStep('menu');
      addBotMessage('Главное меню:', [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]);
      return;
    }

    const dateMatch = dateText.match(/(\d+)/);
    if (!dateMatch) return;

    const day = parseInt(dateMatch[1]);
    const today = new Date();
    let targetDate = new Date(today.getFullYear(), today.getMonth(), day);
    
    if (targetDate < today) {
      targetDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
    }

    setSelectedDate(targetDate);
    setCurrentStep('select_time');

    try {
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      const response = await fetch(`${API_URL}?action=available&date=${dateStr}&bot_id=1`);
      const data = await response.json();

      if (data.success && data.available_slots.length > 0) {
        const currentDate = new Date();
        const selectedDateStart = startOfDay(targetDate);
        const isToday = selectedDateStart.getTime() === startOfDay(currentDate).getTime();

        let slots = data.available_slots;

        if (isToday) {
          const currentHour = currentDate.getHours();
          const currentMinute = currentDate.getMinutes();
          slots = slots.filter((slot: string) => {
            const [hour, minute] = slot.split(':').map(Number);
            return hour > currentHour || (hour === currentHour && minute > currentMinute);
          });
        }

        if (slots.length === 0) {
          addBotMessage(
            'На выбранную дату нет доступных слотов в будущем времени.\n\nВыберите другую дату:',
            [['❌ Отмена']]
          );
          setCurrentStep('select_date');
          return;
        }

        const timeButtons = [];
        for (let i = 0; i < slots.length; i += 3) {
          timeButtons.push(slots.slice(i, i + 3));
        }
        timeButtons.push(['❌ Отмена']);

        addBotMessage(
          `Выберите время на ${format(targetDate, 'd MMMM', { locale: ru })}:`,
          timeButtons
        );
      } else {
        addBotMessage(
          'На выбранную дату нет свободных слотов.\n\nВыберите другую дату:',
          [['❌ Отмена']]
        );
        setCurrentStep('select_date');
      }
    } catch (error) {
      addBotMessage('Ошибка загрузки слотов. Попробуйте позже.', [['❌ Отмена']]);
    }
  };

  const handleTimeSelection = (time: string) => {
    if (time === '❌ Отмена') {
      setCurrentStep('menu');
      addBotMessage('Главное меню:', [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]);
      return;
    }

    setSelectedTime(time);
    setCurrentStep('enter_phone');
    addBotMessage('Введите ваш номер телефона:', [['❌ Отмена']]);
  };

  const handlePhoneInput = (phone: string) => {
    if (phone === '❌ Отмена') {
      setCurrentStep('menu');
      addBotMessage('Главное меню:', [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]);
      return;
    }

    setFormData(prev => ({ ...prev, phone }));
    setCurrentStep('enter_company');
    addBotMessage('Введите название вашей компании:', [['❌ Отмена']]);
  };

  const handleCompanyInput = (company: string) => {
    if (company === '❌ Отмена') {
      setCurrentStep('menu');
      addBotMessage('Главное меню:', [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]);
      return;
    }

    setFormData(prev => ({ ...prev, company }));
    setCurrentStep('select_vehicle');
    addBotMessage(
      'Выберите тип транспорта:',
      [['Газель', 'Фургон'], ['Фура', 'Манипулятор'], ['Контейнер'], ['❌ Отмена']]
    );
  };

  const handleVehicleSelection = (vehicle: string) => {
    if (vehicle === '❌ Отмена') {
      setCurrentStep('menu');
      addBotMessage('Главное меню:', [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]);
      return;
    }

    setFormData(prev => ({ ...prev, vehicle }));
    setCurrentStep('enter_cargo');
    addBotMessage('Опишите груз (или отправьте "-" чтобы пропустить):', [['❌ Отмена']]);
  };

  const handleCargoInput = async (cargo: string) => {
    if (cargo === '❌ Отмена') {
      setCurrentStep('menu');
      addBotMessage('Главное меню:', [['📅 Забронировать время', '📋 Мои бронирования'], ['ℹ️ Информация']]);
      return;
    }

    const finalCargo = cargo === '-' ? '' : cargo;
    setFormData(prev => ({ ...prev, cargo: finalCargo }));

    if (!selectedDate || !selectedTime) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_user_id: userId,
          telegram_username: 'demo_user',
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTime,
          user_phone: formData.phone,
          user_company: formData.company,
          vehicle_type: formData.vehicle,
          cargo_description: finalCargo,
          bot_id: 1
        })
      });

      const data = await response.json();

      if (data.success) {
        addBotMessage(
          `✅ Бронирование успешно создано!\n\n` +
          `📅 Дата: ${format(selectedDate, 'd MMMM yyyy', { locale: ru })}\n` +
          `⏰ Время: ${selectedTime}\n` +
          `🏢 Компания: ${formData.company}\n` +
          `🚚 Транспорт: ${formData.vehicle}\n\n` +
          `Ждём вас на складе!`,
          [['📅 Забронировать ещё', '📋 Мои бронирования']]
        );
        
        toast({
          title: 'Успешно!',
          description: 'Бронирование создано'
        });
      } else {
        addBotMessage(
          `❌ Ошибка: ${data.error}\n\nПопробуйте другое время.`,
          [['📅 Забронировать время', '📋 Мои бронирования']]
        );
      }

      setCurrentStep('menu');
    } catch (error) {
      addBotMessage(
        '❌ Ошибка соединения с сервером.',
        [['📅 Забронировать время', '📋 Мои бронирования']]
      );
      setCurrentStep('menu');
    }
  };

  const loadUserBookings = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch(`${API_URL}?action=list&user_id=${userId}&date_from=${today}&status=active`);
      const data = await response.json();

      if (data.success && data.bookings.length > 0) {
        setCurrentBookings(data.bookings);
        let bookingText = '📋 Ваши активные бронирования:\n\n';
        
        data.bookings.forEach((booking: any, index: number) => {
          bookingText += `${index + 1}. ${format(new Date(booking.booking_date), 'd MMMM', { locale: ru })} в ${booking.booking_time}\n`;
          bookingText += `   🏢 ${booking.user_company}\n`;
          bookingText += `   🚚 ${booking.vehicle_type}\n\n`;
        });

        const cancelButtons = data.bookings.map((booking: any, index: number) => 
          `❌ Отменить #${index + 1}`
        );
        
        const buttonRows = [];
        for (let i = 0; i < cancelButtons.length; i += 2) {
          buttonRows.push(cancelButtons.slice(i, i + 2));
        }
        buttonRows.push(['🔙 Назад']);

        addBotMessage(bookingText, buttonRows);
      } else {
        addBotMessage(
          '📋 У вас пока нет активных бронирований.',
          [['📅 Забронировать время']]
        );
      }
    } catch (error) {
      addBotMessage(
        '❌ Ошибка загрузки бронирований.',
        [['🔙 Назад']]
      );
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${bookingId}&reason=Отменено пользователем`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        addBotMessage(
          '✅ Бронирование отменено!\n\nВремя снова доступно для других.',
          [['📅 Забронировать время', '📋 Мои бронирования']]
        );
        
        toast({
          title: 'Успешно',
          description: 'Бронирование отменено'
        });
        
        setCurrentStep('menu');
      } else {
        addBotMessage(
          '❌ Ошибка отмены бронирования.',
          [['🔙 Назад']]
        );
      }
    } catch (error) {
      addBotMessage(
        '❌ Ошибка соединения с сервером.',
        [['🔙 Назад']]
      );
    }
  };

  const handleInput = () => {
    if (!inputValue.trim()) return;
    handleKeyboardButton(inputValue);
    setInputValue('');
  };

  return {
    messages,
    inputValue,
    messagesEndRef,
    setInputValue,
    handleKeyboardButton,
    handleInput
  };
};

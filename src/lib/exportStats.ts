import * as XLSX from 'xlsx';

interface BotStats {
  bot_id: number;
  bot_name: string;
  total_users: number;
  total_messages: number;
  created_at: string;
  payment_enabled: boolean;
  payment_url: string;
  qr_codes: {
    total: number;
    used: number;
    available: number;
    vip_total: number;
    free_total: number;
    free_configured: number;
    vip_configured: number;
  };
}

export const exportToExcel = (stats: BotStats) => {
  const summaryData = [
    ['Название бота', stats.bot_name],
    ['ID бота', stats.bot_id],
    ['Дата создания', new Date(stats.created_at).toLocaleString('ru-RU')],
    [''],
    ['ОСНОВНАЯ СТАТИСТИКА'],
    ['Всего пользователей', stats.total_users],
    ['Всего сообщений', stats.total_messages],
    [''],
    ['QR-КОДЫ'],
    ['Всего создано', stats.qr_codes.total],
    ['Использовано', stats.qr_codes.used],
    ['Доступно', stats.qr_codes.available],
    ['VIP кодов', stats.qr_codes.vip_total],
    ['Бесплатных кодов', stats.qr_codes.free_total],
    ['Настроено бесплатных', stats.qr_codes.free_configured],
    ['Настроено VIP', stats.qr_codes.vip_configured],
    [''],
    ['ПЛАТЕЖИ'],
    ['Платежи включены', stats.payment_enabled ? 'Да' : 'Нет'],
    ['Платежная ссылка', stats.payment_url || 'Не указана'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  ws['!cols'] = [
    { wch: 30 },
    { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Статистика');

  const fileName = `bot_stats_${stats.bot_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportToCSV = (stats: BotStats) => {
  const csvData = [
    ['Параметр', 'Значение'],
    ['Название бота', stats.bot_name],
    ['ID бота', stats.bot_id],
    ['Дата создания', new Date(stats.created_at).toLocaleString('ru-RU')],
    [''],
    ['ОСНОВНАЯ СТАТИСТИКА', ''],
    ['Всего пользователей', stats.total_users],
    ['Всего сообщений', stats.total_messages],
    [''],
    ['QR-КОДЫ', ''],
    ['Всего создано', stats.qr_codes.total],
    ['Использовано', stats.qr_codes.used],
    ['Доступно', stats.qr_codes.available],
    ['VIP кодов', stats.qr_codes.vip_total],
    ['Бесплатных кодов', stats.qr_codes.free_total],
    ['Настроено бесплатных', stats.qr_codes.free_configured],
    ['Настроено VIP', stats.qr_codes.vip_configured],
    [''],
    ['ПЛАТЕЖИ', ''],
    ['Платежи включены', stats.payment_enabled ? 'Да' : 'Нет'],
    ['Платежная ссылка', stats.payment_url || 'Не указана'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(csvData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `bot_stats_${stats.bot_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

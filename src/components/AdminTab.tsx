import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  bots_count: number;
  created_at: string;
}

interface AdminTabProps {
  getStatusColor: (status: string) => string;
}

const AdminTab = ({ getStatusColor }: AdminTabProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/f9ce7f74-6b2b-44d4-9505-72fb689a4374?all=true');
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold">Админ-панель</h2>
        <p className="text-muted-foreground mt-1">Управление пользователями и оплатами</p>
      </div>
      
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1 text-blue-600 dark:text-blue-400">Активация ботов</p>
            <p className="text-muted-foreground">
              После одобрения модерацией, боты требуют ручной активации на сервере. 
              Для запуска бота обратитесь к системному администратору с данными: ID бота, токен, логика работы.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Users" size={20} className="text-primary" />
            <h3 className="font-semibold">Пользователи</h3>
          </div>
          <p className="text-3xl font-bold">{users.length}</p>
          <p className="text-sm text-muted-foreground">Всего зарегистрировано</p>
        </Card>
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Bot" size={20} className="text-purple-400" />
            <h3 className="font-semibold">Ботов</h3>
          </div>
          <p className="text-3xl font-bold">{users.reduce((sum, u) => sum + u.bots_count, 0)}</p>
          <p className="text-sm text-muted-foreground">Всего создано</p>
        </Card>
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Shield" size={20} className="text-orange-400" />
            <h3 className="font-semibold">Администраторы</h3>
          </div>
          <p className="text-3xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-sm text-muted-foreground">С полным доступом</p>
        </Card>
      </div>

      <Card className="glass-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Список пользователей</h3>
            <div className="flex gap-2">
              <Input placeholder="Поиск..." className="w-64" />
              <Button variant="outline" size="icon">
                <Icon name="Search" size={16} />
              </Button>
            </div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Ботов</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Icon name="Loader2" size={24} className="animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Загрузка...</p>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Нет зарегистрированных пользователей
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-sm font-bold">
                        {user.first_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.telegram_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>@{user.username || 'нет username'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.bots_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.role === 'admin' ? 'bg-orange-500' : 'bg-blue-500'}>
                      {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" title="Просмотр">
                        <Icon name="Eye" size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" title="Редактировать">
                        <Icon name="Edit" size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminTab;
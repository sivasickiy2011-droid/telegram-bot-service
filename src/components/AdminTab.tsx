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
  id: string;
  name: string;
  username: string;
  botsCount: number;
  status: 'active' | 'pending';
}

interface AdminTabProps {
  users: User[];
  getStatusColor: (status: string) => string;
}

const AdminTab = ({ users, getStatusColor }: AdminTabProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold">Админ-панель</h2>
        <p className="text-muted-foreground mt-1">Управление пользователями и оплатами</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Users" size={20} className="text-primary" />
            <h3 className="font-semibold">Пользователи</h3>
          </div>
          <p className="text-3xl font-bold">248</p>
          <p className="text-sm text-muted-foreground">Всего зарегистрировано</p>
        </Card>
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="DollarSign" size={20} className="text-green-400" />
            <h3 className="font-semibold">Оплаты</h3>
          </div>
          <p className="text-3xl font-bold">12</p>
          <p className="text-sm text-muted-foreground">Ожидают подтверждения</p>
        </Card>
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Key" size={20} className="text-magenta" />
            <h3 className="font-semibold">VIP-ключи</h3>
          </div>
          <p className="text-3xl font-bold">89</p>
          <p className="text-sm text-muted-foreground">Активных ключей</p>
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-sm font-bold">
                      {user.name[0]}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.botsCount}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status === 'active' ? 'Активен' : 'Ожидает'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Icon name="Eye" size={14} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Icon name="Edit" size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminTab;

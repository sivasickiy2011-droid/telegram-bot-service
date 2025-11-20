import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import UserBotsDialog from '@/components/UserBotsDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { motion } from 'framer-motion';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [botsDialogOpen, setBotsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewBots = (user: User) => {
    setSelectedUser(user);
    setBotsDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const search = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.telegram_id.toString().includes(search)
    );
  });
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Админ-панель</h2>
            <p className="text-muted-foreground text-sm mt-1">Управление пользователями</p>
          </div>
          {!isMobile && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Icon name="LayoutGrid" size={16} />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Icon name="List" size={16} />
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Поиск по имени, username, ID..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')}>
              <Icon name="X" size={16} />
            </Button>
          )}
        </div>
      </div>
      


      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-4 md:p-6 glass-card">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Icon name="Users" size={isMobile ? 16 : 20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">Пользователи</h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{users.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Зарегистрировано</p>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="p-4 md:p-6 glass-card">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Icon name="Bot" size={isMobile ? 16 : 20} className="text-purple-400" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">Ботов</h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{users.reduce((sum, u) => sum + u.bots_count, 0)}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Всего создано</p>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="col-span-2 md:col-span-1">
          <Card className="p-4 md:p-6 glass-card">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Icon name="Shield" size={isMobile ? 16 : 20} className="text-orange-400" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">Администраторы</h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">С полным доступом</p>
          </Card>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Загрузка пользователей...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center glass-card">
          <Icon name="UserX" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
          <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
        </Card>
      ) : isMobile || viewMode === 'cards' ? (
        <div className="space-y-3">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-purple flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {user.first_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-base">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username || 'нет username'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">ID: {user.telegram_id}</p>
                      </div>
                    </div>
                    <Badge className={user.role === 'admin' ? 'bg-orange-500' : 'bg-blue-500'}>
                      {user.role === 'admin' ? '👑 Админ' : 'Пользователь'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Icon name="Bot" size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {user.bots_count} {user.bots_count === 1 ? 'бот' : 'ботов'}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewBots(user)}
                      className="h-8"
                    >
                      <Icon name="Eye" size={14} className="mr-1" />
                      Просмотр
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
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
              {filteredUsers.map((user) => (
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Просмотр ботов"
                        onClick={() => handleViewBots(user)}
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <UserBotsDialog
        open={botsDialogOpen}
        onOpenChange={setBotsDialogOpen}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminTab;
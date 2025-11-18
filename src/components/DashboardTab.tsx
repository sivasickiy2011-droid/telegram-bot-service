import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Bot {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  users: number;
  messages: number;
  template: string;
}

interface DashboardTabProps {
  bots: Bot[];
  getStatusColor: (status: string) => string;
}

const DashboardTab = ({ bots, getStatusColor }: DashboardTabProps) => {
  const stats = [
    { label: 'Всего ботов', value: bots.length.toString(), change: '+' + bots.length, icon: 'Bot', gradient: 'gradient-purple' },
    { label: 'Активных ботов', value: bots.filter(b => b.status === 'active').length.toString(), change: '+' + bots.filter(b => b.status === 'active').length, icon: 'Users', gradient: 'gradient-blue' },
    { label: 'Всего пользователей', value: bots.reduce((sum, b) => sum + b.users, 0).toString(), change: '+23%', icon: 'MessageSquare', gradient: 'gradient-orange' },
    { label: 'Всего сообщений', value: bots.reduce((sum, b) => sum + b.messages, 0).toString(), change: '+45', icon: 'Key', gradient: 'gradient-purple' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="p-6 glass-card hover:scale-105 transition-transform duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                <Icon name={stat.icon as any} size={24} className="text-white" />
              </div>
              <Badge variant="secondary" className="text-green-400 bg-green-400/10">
                {stat.change}
              </Badge>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Активность ботов</h3>
            <Button variant="outline" size="sm">
              <Icon name="RefreshCw" size={14} />
            </Button>
          </div>
          <div className="space-y-4">
            {bots.slice(0, 3).map((bot) => (
              <div key={bot.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(bot.status)}`} />
                  <div>
                    <p className="font-semibold">{bot.name}</p>
                    <p className="text-sm text-muted-foreground">{bot.users} пользователей</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{bot.messages}</p>
                  <p className="text-xs text-muted-foreground">сообщений</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Последние пользователи</h3>
            <Button variant="outline" size="sm">
              <Icon name="UserPlus" size={14} />
            </Button>
          </div>
          <div className="space-y-4">
            {users.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-blue flex items-center justify-center text-white font-bold">
                    {user.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(user.status)}>
                  {user.status === 'active' ? 'Активен' : 'Ожидает'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
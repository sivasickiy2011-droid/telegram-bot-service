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
  interactions_today?: number;
  interactions_yesterday?: number;
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
    <div className="space-y-4 md:space-y-8 animate-fade-in pb-20 md:pb-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="p-4 md:p-6 glass-card hover:scale-105 transition-transform duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                <Icon name={stat.icon as any} size={20} className="text-white md:w-6 md:h-6" />
              </div>
              <Badge variant="secondary" className="text-green-400 bg-green-400/10 text-[10px] md:text-xs h-5 md:h-6">
                {stat.change}
              </Badge>
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 glass-card">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold">Активность ботов</h3>
            <Button variant="outline" size="sm" className="h-8 md:h-9">
              <Icon name="RefreshCw" size={14} />
            </Button>
          </div>
          <div className="space-y-3 md:space-y-4">
            {bots.slice(0, 3).map((bot) => {
              const interactionsToday = bot.interactions_today || 0;
              const interactionsYesterday = bot.interactions_yesterday || 0;
              const trendPercent = interactionsYesterday > 0 
                ? Math.round(((interactionsToday - interactionsYesterday) / interactionsYesterday) * 100)
                : interactionsToday > 0 ? 100 : 0;
              const isPositiveTrend = trendPercent >= 0;
              
              return (
                <div key={bot.id} className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(bot.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate">{bot.name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-xs md:text-sm text-muted-foreground">
                        <span>{bot.users} пользователей</span>
                        <span className="hidden sm:inline text-xs">•</span>
                        <div className="flex items-center gap-1">
                          <Icon name="Zap" size={12} className="text-orange-500" />
                          <span>{interactionsToday} взаимодействий</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Icon 
                          name={isPositiveTrend ? "TrendingUp" : "TrendingDown"} 
                          size={16} 
                          className={isPositiveTrend ? "text-green-500" : "text-red-500"}
                        />
                        <span className={`text-xs font-medium ${isPositiveTrend ? 'text-green-500' : 'text-red-500'}`}>
                          {trendPercent > 0 ? '+' : ''}{trendPercent}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">чем вчера</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Популярные шаблоны</h3>
            <Button variant="outline" size="sm">
              <Icon name="TrendingUp" size={14} />
            </Button>
          </div>
          <div className="space-y-4">
            {['Поддержка', 'Магазин', 'Блог'].map((template, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center text-white font-bold">
                    {template[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{template}</p>
                    <p className="text-sm text-muted-foreground">{bots.filter(b => b.template === template.toLowerCase()).length} ботов</p>
                  </div>
                </div>
                <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
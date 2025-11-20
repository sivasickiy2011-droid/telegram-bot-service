import { motion } from 'framer-motion';
import Icon from '@/components/ui/icon';
import { triggerHaptic } from '@/utils/haptics';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

const MobileBottomNav = ({ activeTab, onTabChange, isAdmin }: MobileBottomNavProps) => {
  const handleTabChange = (tabId: string) => {
    triggerHaptic('light');
    onTabChange(tabId);
  };
  const userTabs = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: 'Главная' },
    { id: 'bots', icon: 'Bot', label: 'Боты' },
    { id: 'templates', icon: 'LayoutTemplate', label: 'Шаблоны' },
  ];

  const adminTabs = [
    { id: 'moderation', icon: 'AlertCircle', label: 'Модерация' },
    { id: 'activation', icon: 'Play', label: 'Активация' },
    { id: 'rotation', icon: 'RefreshCw', label: 'Ротация' },
    { id: 'admin', icon: 'Shield', label: 'Админ' },
  ];

  const tabs = isAdmin ? [...userTabs, ...adminTabs] : userTabs;

  return (
    <>
      <div className="h-20 md:hidden" />
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="safe-area-inset-bottom">
          <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} gap-0 px-2 py-2`}>
            {tabs.slice(0, isAdmin ? 4 : 3).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon 
                    name={tab.icon} 
                    size={20} 
                    className={`mb-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
            
            {isAdmin && (
              <motion.button
                onClick={() => {
                  const menu = document.getElementById('admin-menu');
                  if (menu) {
                    menu.classList.toggle('hidden');
                  }
                }}
                className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="MoreHorizontal" size={20} className="mb-1 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Еще</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {isAdmin && (
        <div
          id="admin-menu"
          className="hidden fixed bottom-20 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-lg border-t border-b border-border"
        >
          <div className="grid grid-cols-3 gap-2 p-4">
            {adminTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    handleTabChange(tab.id);
                    document.getElementById('admin-menu')?.classList.add('hidden');
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                    isActive ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon 
                    name={tab.icon} 
                    size={24} 
                    className={`mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
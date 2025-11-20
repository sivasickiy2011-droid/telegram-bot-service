import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { triggerHaptic } from '@/utils/haptics';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
}

const MobileBottomNav = ({ activeTab, onTabChange, isAdmin }: MobileBottomNavProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);
  
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
    { id: 'admin', icon: 'Users', label: 'Пользователи' },
  ];

  const mainTabs = userTabs;

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
          <div className="grid grid-cols-4 gap-0 px-2 py-2">
            {mainTabs.map((tab) => {
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
            
            <motion.button
              onClick={() => {
                triggerHaptic('medium');
                setIsMenuOpen(!isMenuOpen);
              }}
              className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {isMenuOpen && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative">
                <motion.div
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon 
                    name={isAdmin ? 'Settings' : 'User'} 
                    size={20} 
                    className={`mb-1 transition-colors ${isMenuOpen ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </motion.div>
                {isAdmin && adminTabs.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                  >
                    <span className="text-[8px] font-bold text-white">{adminTabs.length}</span>
                  </motion.div>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isMenuOpen ? 'text-primary' : 'text-muted-foreground'}`}>
                {isAdmin ? 'Админ' : 'Профиль'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-2 right-2 z-50 md:hidden"
            >
              <div className="bg-card/95 backdrop-blur-lg rounded-3xl border border-border shadow-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Icon name="Shield" size={16} className="text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Админ-панель</h3>
                    </div>
                    <motion.button
                      onClick={() => setIsMenuOpen(false)}
                      className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Icon name="X" size={16} className="text-muted-foreground" />
                    </motion.button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {isAdmin && adminTabs.map((tab, index) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            handleTabChange(tab.id);
                            setIsMenuOpen(false);
                          }}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all ${
                            isActive ? 'bg-primary/10 border-2 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`w-12 h-12 rounded-xl ${
                            isActive ? 'bg-primary/20' : 'bg-muted/50'
                          } flex items-center justify-center mb-2`}>
                            <Icon 
                              name={tab.icon} 
                              size={20} 
                              className={isActive ? 'text-primary' : 'text-muted-foreground'}
                            />
                          </div>
                          <span className={`text-xs font-medium text-center ${
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {tab.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
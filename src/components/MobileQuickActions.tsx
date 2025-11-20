import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  onClick: () => void;
}

interface MobileQuickActionsProps {
  isOpen: boolean;
  onClose: () => void;
  actions: QuickAction[];
}

const MobileQuickActions = ({ isOpen, onClose, actions }: MobileQuickActionsProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          >
            <Card className="rounded-t-3xl rounded-b-none border-t border-x border-border bg-card p-6 pb-8 safe-area-inset-bottom">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Быстрые действия</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <Icon name="X" size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {actions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => {
                      action.onClick();
                      onClose();
                    }}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-12 h-12 rounded-xl ${action.gradient} flex items-center justify-center`}>
                      <Icon name={action.icon} size={20} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileQuickActions;

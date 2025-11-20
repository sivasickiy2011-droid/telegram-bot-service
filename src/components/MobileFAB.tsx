import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface MobileFABProps {
  icon: string;
  label?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  position?: 'bottom-right' | 'bottom-left';
}

const MobileFAB = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'primary',
  position = 'bottom-right'
}: MobileFABProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-24 right-4',
    'bottom-left': 'bottom-24 left-4',
  };

  const variantClasses = {
    'primary': 'gradient-purple',
    'secondary': 'bg-secondary',
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`fixed z-40 md:hidden ${positionClasses[position]}`}
    >
      <motion.button
        onClick={onClick}
        className={`${variantClasses[variant]} shadow-2xl rounded-full flex items-center gap-2 px-4 h-14 text-white font-medium`}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
      >
        <Icon name={icon} size={20} className="text-white" />
        {label && <span className="text-sm">{label}</span>}
      </motion.button>
    </motion.div>
  );
};

export default MobileFAB;

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  threshold = 100 
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-threshold, 0, threshold], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-threshold, 0, threshold], [0.95, 1, 0.95]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (info.offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    x.set(0);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ x, opacity, scale }}
      className="relative"
    >
      {isDragging && (
        <>
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold text-sm"
            style={{ opacity: useTransform(x, [0, threshold], [0, 1]) }}
          >
            ✓ Действие
          </motion.div>
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold text-sm"
            style={{ opacity: useTransform(x, [-threshold, 0], [1, 0]) }}
          >
            ✗ Скрыть
          </motion.div>
        </>
      )}
      {children}
    </motion.div>
  );
};

export default SwipeableCard;

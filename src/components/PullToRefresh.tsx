import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Icon from '@/components/ui/icon';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const y = useMotionValue(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rotate = useTransform(y, [0, 80], [0, 360]);
  const opacity = useTransform(y, [0, 80], [0, 1]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const diff = Math.max(0, (currentY - startY.current) * 0.5);
      y.set(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling) {
      setIsPulling(false);
      if (y.get() > 80 && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          y.set(0);
        }
      } else {
        y.set(0);
      }
    }
  };

  useEffect(() => {
    if (isRefreshing) {
      y.set(60);
    }
  }, [isRefreshing, y]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <motion.div
        style={{ y }}
        className="relative"
      >
        <motion.div
          style={{ opacity }}
          className="absolute top-0 left-0 right-0 flex justify-center -mt-16"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm">
            <motion.div style={{ rotate }}>
              <Icon
                name={isRefreshing ? "Loader2" : "RefreshCw"}
                size={20}
                className={`text-primary ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </motion.div>
            <span className="text-sm font-medium text-primary">
              {isRefreshing ? 'Обновление...' : 'Потяните для обновления'}
            </span>
          </div>
        </motion.div>
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomScrollbar = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const totalScroll = documentHeight - windowHeight;
      const progress = (scrollTop / totalScroll) * 100;
      
      setScrollProgress(progress);
      setIsVisible(totalScroll > 0);
      setIsScrolling(true);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <AnimatePresence>
        {isScrolling && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed right-2 top-20 bottom-20 z-[100] pointer-events-none hidden md:block"
          >
          <div className="relative h-full w-2">
            <div className="absolute inset-0 bg-muted/30 rounded-full backdrop-blur-sm" />
            
            <motion.div
              className="absolute top-0 right-0 w-2 rounded-full shadow-lg"
              style={{
                height: `${Math.max(10, scrollProgress)}%`,
                background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(147, 51, 234, 0.3)',
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
                }}
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            <motion.div
              className="absolute w-4 h-4 -left-1 rounded-full border-2 border-background"
              style={{
                top: `${scrollProgress}%`,
                transform: 'translateY(-50%)',
                background: 'hsl(var(--primary))',
                boxShadow: '0 0 15px rgba(147, 51, 234, 0.6), 0 0 30px rgba(147, 51, 234, 0.4)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-white/30 rounded-full" />
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            className="absolute -left-16 bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/30 shadow-2xl"
            style={{
              top: `${scrollProgress}%`,
              transform: 'translateY(-50%)',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)',
            }}
          >
            <span className="text-xs font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {Math.round(scrollProgress)}%
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {isScrolling && (
        <motion.div
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 5 }}
          transition={{ duration: 0.2 }}
          className="fixed right-1 top-24 bottom-24 z-[100] pointer-events-none md:hidden"
        >
          <div className="relative h-full w-1">
            <div className="absolute inset-0 bg-muted/20 rounded-full" />
            
            <motion.div
              className="absolute top-0 right-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-full"
              style={{
                height: `${Math.max(10, scrollProgress)}%`,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default CustomScrollbar;
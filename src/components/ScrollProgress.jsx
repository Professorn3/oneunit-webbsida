import { motion, useScroll, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function ScrollProgress() {
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  if (location.pathname !== '/gallery') {
    return null;
  }

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: '#ffffff',
        transformOrigin: '0%',
        scaleX,
        zIndex: 9999,
        boxShadow: '0 0 10px rgba(255,255,255,0.5)'
      }}
    />
  );
}

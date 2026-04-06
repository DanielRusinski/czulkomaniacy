import { useEffect, useMemo } from 'react';
import Stats from 'three/examples/jsm/libs/stats.module';

/**
 * Samodzielny licznik FPS działający poza Canvasem.
 */
const FpsStats = () => {
  const stats = useMemo(() => {
    const s = new Stats();
    s.showPanel(0); // 0: fps, 1: ms, 2: mb
    return s;
  }, []);

  useEffect(() => {
    document.body.appendChild(stats.dom);
    
    let animationId;
    const update = () => {
      stats.update();
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
      if (document.body.contains(stats.dom)) {
        document.body.removeChild(stats.dom);
      }
    };
  }, [stats]);

  return null;
};

export default FpsStats;
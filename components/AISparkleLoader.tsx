'use client';

import React, { useRef, useEffect } from 'react';
import { llmSeoLoadingMessages, getRandomMessage } from '@/app/utils/loadingMessages';
import styles from '@/styles/AISparkleLoader.module.scss';

interface AISparkleLoaderProps {
  isLoading: boolean;
  className?: string;
}

const AISparkleLoader: React.FC<AISparkleLoaderProps> = ({ isLoading, className = '' }) => {
  const [currentMessage, setCurrentMessage] = React.useState(getRandomMessage());
  const loaderRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to loader when it appears
  useEffect(() => {
    if (isLoading && loaderRef.current) {
      // Small delay to ensure the loader is fully rendered
      const scrollTimer = setTimeout(() => {
        if (loaderRef.current) {
          loaderRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimer);
    }
  }, [isLoading]);

  // Rotate messages every 3.5 seconds
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentMessage(getRandomMessage());
    }, 3500); // Change message every 3.5 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div ref={loaderRef} className={`${styles.aiSparkleLoader} ${className}`}>
      {/* AI Sparkle Animation */}
      <div className={styles.sparkleContainer}>
        <div className={`${styles.sparkle} ${styles.sparkle1}`}>✨</div>
        <div className={`${styles.sparkle} ${styles.sparkle2}`}>⭐</div>
        <div className={`${styles.sparkle} ${styles.sparkle3}`}>💫</div>
        <div className={`${styles.sparkle} ${styles.sparkle4}`}>🌟</div>
        <div className={`${styles.sparkle} ${styles.sparkle5}`}>✨</div>
        <div className={`${styles.sparkle} ${styles.sparkle6}`}>⭐</div>
        <div className={`${styles.sparkle} ${styles.sparkle7}`}>💫</div>
        <div className={`${styles.sparkle} ${styles.sparkle8}`}>🌟</div>
      </div>
      
      {/* Loading Message */}
      <div className={styles.loadingMessage}>
        {currentMessage}
      </div>
    </div>
  );
};

export default AISparkleLoader; 
import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="flex flex-col items-center justify-center h-screen bg-white"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <h2 className="text-sm text-gray-500 tracking-widest">A KAICHAT EXPERIENCE</h2>
      </motion.div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-4"
      >
        <h1 className="text-6xl font-bold text-stone-800">
          KAICHAT
        </h1>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
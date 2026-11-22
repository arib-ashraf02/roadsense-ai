"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0.85, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
}

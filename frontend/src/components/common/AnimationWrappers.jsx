"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

/**
 * FadeInView: Scroll-triggered entrance animation.
 * Re-animates only once when entering viewport to prevent jitter.
 */
export function FadeInView({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 20,
  className = "",
  threshold = 0.15,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer & StaggerItem: Orchestrated staggered entrance for grids and lists.
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.08,
  initialDelay = 0.05,
  className = "",
  viewportOnce = true,
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, amount: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }) {
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * AnimatedCounter: Counts smoothly from 0 to the target number when visible.
 * Handles numbers with decimals (e.g. 98.4), multipliers (e.g. 3.2x), percentages (100%), and units (15m).
 */
export function AnimatedCounter({ value, duration = 0.8, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [displayValue, setDisplayValue] = useState(String(value));

  useEffect(() => {
    if (!isInView) return;

    const str = String(value);
    const match = str.match(/^([^\d.]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match) {
      setDisplayValue(str);
      return;
    }

    const prefix = match[1] || "";
    const targetNum = parseFloat(match[2]);
    const suffix = match[3] || "";
    const decimals = match[2].includes(".") ? match[2].split(".")[1].length : 0;

    const controls = animate(0, targetNum, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        setDisplayValue(`${prefix}${latest.toFixed(decimals)}${suffix}`);
      },
      onComplete() {
        setDisplayValue(str);
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}

/**
 * InteractiveCard: Card wrapper with smooth hover lift and tap feedback.
 */
export function InteractiveCard({ children, className = "", style = {}, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.22, ease: "easeOut" } }}
      whileTap={{ scale: 0.985, transition: { duration: 0.1 } }}
      className={`transition-shadow duration-200 ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

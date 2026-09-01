'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface AssistedPasswordConfirmationProps {
  password: string;
  onConfirmChange?: (confirmPassword: string, isValid: boolean) => void;
  className?: string;
}

export function AssistedPasswordConfirmation({
  password,
  onConfirmChange,
  className
}: AssistedPasswordConfirmationProps) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shake, setShake] = useState(false);

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    if (
      confirmPassword.length >= password.length &&
      val.length > confirmPassword.length
    ) {
      setShake(true);
    } else {
      setConfirmPassword(val);
      if (onConfirmChange) {
        onConfirmChange(val, val === password && val.length > 0);
      }
    }
  };

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  const getLetterStatus = (letter: string, index: number) => {
    if (!confirmPassword[index]) return '';
    return confirmPassword[index] === letter
      ? 'bg-green-500/20'
      : 'bg-red-500/20';
  };

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const bounceAnimation = {
    x: shake ? [-10, 10, -10, 10, 0] : 0,
    transition: { duration: 0.5 },
  };

  const matchAnimation = {
    scale: passwordsMatch ? [1, 1.05, 1] : 1,
    transition: { duration: 0.3 },
  };

  const borderAnimation = {
    borderColor: passwordsMatch ? '#10B981' : confirmPassword.length > 0 && !passwordsMatch ? '#EF4444' : '#E2E8F0',
    transition: { duration: 0.3 },
  };

  return (
    <div className={`relative flex w-full flex-col items-start justify-center ${className || ''}`}>
      {/* Visual Dot Sequence with per-character validation overlay */}
      {password.length > 0 && (
        <motion.div
          className="mb-2 mt-1 h-[48px] w-full rounded-full border border-slate-200 bg-[#f0f2f5] px-3 py-1.5 overflow-hidden flex items-center"
          animate={{
            ...bounceAnimation,
            ...matchAnimation,
            ...borderAnimation,
          }}
        >
          <div className="relative h-full w-fit overflow-hidden rounded-lg">
            <div className="z-10 flex h-full items-center justify-start bg-transparent px-0 py-1 tracking-[0.15em]">
              {password.split('').map((_, index) => (
                <div
                  key={index}
                  className="flex h-full w-4 shrink-0 items-center justify-center"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 top-0 z-0 flex h-full w-full items-center justify-start">
              {password.split('').map((letter, index) => (
                <motion.div
                  key={index}
                  className={`ease absolute h-full w-4 transition-all duration-300 ${getLetterStatus(
                    letter,
                    index
                  )}`}
                  style={{
                    left: `${index * 16}px`,
                    scaleX: confirmPassword[index] ? 1 : 0,
                    transformOrigin: 'left',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirm Password Input Field */}
      <motion.div
        className="h-[48px] w-full overflow-hidden rounded-full"
        animate={matchAnimation}
      >
        <motion.input
          className="h-full w-full rounded-full border border-slate-200 bg-[#f0f2f5] px-4 py-2.5 text-sm text-[#2f3542] tracking-normal outline-none placeholder:text-[#a4b0be] focus:border-[#5c72e8]"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          animate={borderAnimation}
        />
      </motion.div>
    </div>
  );
}

export default AssistedPasswordConfirmation;

'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes';
import { BiMoon, BiSun } from 'react-icons/bi';




export const ThemeSwitcher= () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
    // Safe to call setMounted here, ignoring hydration mismatch warning
    setMounted(true);
  }, []);

  // Avoid rendering anything until mounted
  if (!mounted) return null;

  return (
    <div className="flex items-center justify-center mx-4">
        {theme === "light" ? (
          <BiMoon
            className="text-2xl text-gray-800 cursor-pointer"
            fill='black'
            size={25}
            onClick={() => setTheme("dark")}
          />
        ) : (
          <BiSun
            className="text-2xl text-yellow-500 cursor-pointer"
            size={25}
            onClick={() => setTheme("light")}
          />
        )}
      </div>    
  )
};


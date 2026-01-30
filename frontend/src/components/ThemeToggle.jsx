import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition duration-300 hover:bg-opacity-20 hover:bg-gray-500 ${className}`}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Sun className="h-6 w-6 text-yellow-300" />
            ) : (
                <Moon className="h-6 w-6 text-white" />
            )}
        </button>
    );
};

export default ThemeToggle;

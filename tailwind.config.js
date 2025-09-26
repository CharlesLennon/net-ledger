/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js', 
    './resources/**/*.vue',
    './app/**/*.php'
  ],
  safelist: [
    'bg-red-50',
    'bg-red-100', 
    'bg-red-200',
    'dark:bg-red-900/10',
    'dark:bg-red-900/20',
    'dark:bg-red-900/30',
    'border-red-200',
    'border-red-300',
    'dark:border-red-700',
    'dark:border-red-600',
    'text-red-800',
    'dark:text-red-200',
    'hover:bg-red-200',
    'dark:hover:bg-red-800'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

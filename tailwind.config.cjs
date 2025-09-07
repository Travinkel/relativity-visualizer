/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html','./src/**/*.{ts,tsx,js,jsx}'],
    theme: { extend: {} },
    // Tailwind v4 plugin format: use an object instead of an array
    plugins: {
        daisyui: {},
    },
    daisyui: {
        themes: ['light', 'dark', 'business', 'forest'],
    },
};

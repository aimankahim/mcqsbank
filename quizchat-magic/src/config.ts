// For Vite projects
const API_URL = (() => {
    const envUrl = import.meta.env?.VITE_API_URL;
    console.log('Environment API URL:', envUrl);
    // Use the production URL if no environment variable is set
    return envUrl || 'https://django-based-mcq-app.onrender.com';
})();

// For Create React App projects
// const API_URL = process.env.REACT_APP_API_URL || 'https://django-based-mcq-app.onrender.com';

export const config = {
    API_URL,
}; 
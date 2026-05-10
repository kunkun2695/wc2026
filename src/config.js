const API_URL = import.meta.env.VITE_API_URL || 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                  ? 'http://localhost:5005' 
                  : `${window.location.protocol}//${window.location.hostname}:5005`);

export default API_URL;

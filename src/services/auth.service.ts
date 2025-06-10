import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth'; // Update with your backend URL

interface AuthResponse {
  status: string;
  token: string;
  refreshToken: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/signup`, {
    name,
    email,
    password
  });
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password
  });
  return response.data;
};

// Store user data in localStorage
export const storeAuthData = (data: AuthResponse) => {
  localStorage.setItem('authData', JSON.stringify(data));
};

// Get stored auth data
export const getAuthData = (): AuthResponse | null => {
  const data = localStorage.getItem('authData');
  return data ? JSON.parse(data) : null;
};

// Clear auth data
export const clearAuthData = () => {
  localStorage.removeItem('authData');
};


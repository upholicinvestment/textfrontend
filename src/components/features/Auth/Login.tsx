import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { markSessionStart } from '../../../api';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import { AuthContext } from '../../../context/AuthContext';

/* ✅ Toastify */
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // keep state so your logic is unchanged; we just won't render them as inline banners
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /* 🔔 Fire toasts when messages change (logic unchanged) */
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (successMessage) toast.success(successMessage);
  }, [successMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      // ✅ mark session start for 7-day auto logout
      markSessionStart();
      login(res.data.token, res.data.user);
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4">
      {/* 🔔 Toasts only */}
      <ToastContainer position="top-right" autoClose={3500} newestOnTop />

      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex relative">
        {/* Close button */}
        <Link
          to="/"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </Link>

        {/* Left Side - Illustration */}
        <div className="hidden md:flex flex-1 bg-indigo-600 p-12 items-center justify-center">
          <div className="text-white text-center">
            <img
              src="https://stories.freepiklabs.com/storage/1765/7-Login_Mesa-de-trabajo-1.svg"
              alt="Security Illustration"
              className="w-full h-auto max-w-md mx-auto"
            />
            <h2 className="text-3xl font-bold mb-4">Secure Access</h2>
            <p className="text-indigo-100">
              Protect your account with our advanced security features
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-500">Sign in to continue to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                }`}
              >
                <span className="text-white font-medium">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </span>
                {!isLoading && <FiArrowRight className="text-white" />}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

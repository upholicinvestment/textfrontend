import { useState, useEffect } from 'react';
import api from '../../../api';
import { FiPhone, FiKey, FiLock, FiArrowRight } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

/* ✅ React-Toastify */
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [resetId, setResetId] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* 🔔 Toastify side-effect (logic unchanged; UI banners removed) */
  useEffect(() => {
    if (!msg) return;
    if (msg.type === 'ok') toast.success(msg.text);
    else toast.error(msg.text);
  }, [msg]);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!emailOrPhone) {
      setMsg({ type: 'err', text: 'Please enter your email or phone' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { emailOrPhone });
      setResetId(res.data.resetId || '');
      setMsg({ type: 'ok', text: 'If the account exists, an OTP has been sent.' });
      setStep('verify');
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!resetId || !otp || !newPassword) {
      setMsg({ type: 'err', text: 'Enter OTP and new password' });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { resetId, otp, newPassword });
      setMsg({ type: 'ok', text: 'Password updated. Redirecting to login…' });
      setTimeout(() => navigate('/login'), 1000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'Invalid OTP or expired' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-4">
      {/* 🔔 Toast container (toasts only; inline banners removed) */}
      <ToastContainer position="top-right" autoClose={3500} newestOnTop />

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {step === 'request' ? 'Forgot Password' : 'Verify OTP & Reset'}
            </h1>
            <p className="text-gray-500">
              {step === 'request'
                ? 'Enter your phone number to receive an OTP.'
                : 'Enter the OTP you received and set a new password.'}
            </p>
          </div>

          {/* ⛔️ Removed inline {msg} banner — Toastify handles messages */}

          {step === 'request' ? (
            <form onSubmit={onRequest} className="space-y-4">
              <div className="relative">
                {/* <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> */}
                <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  placeholder="Phone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md'
                }`}
              >
                <span className="text-white font-medium">
                  {isLoading ? 'Sending OTP…' : 'Send OTP'}
                </span>
                {!isLoading && <FiArrowRight className="text-white" />}
              </button>

              <div className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={onReset} className="space-y-4">
              {/* OTP */}
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all tracking-widest"
                />
              </div>

              {/* New Password */}
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md'
                }`}
              >
                <span className="text-white font-medium">
                  {isLoading ? 'Resetting…' : 'Reset Password'}
                </span>
                {!isLoading && <FiArrowRight className="text-white" />}
              </button>

              <div className="text-center text-sm text-gray-500">
                Didn’t get it?{' '}
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;

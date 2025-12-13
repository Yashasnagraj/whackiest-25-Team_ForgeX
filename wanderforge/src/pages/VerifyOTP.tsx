import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { toast, ToastContainer } from '../components/auth/Toast';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const { verifyOTP, resendOTP, isLoading } = useAuthStore();

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await verifyOTP(email, otp);
      toast.success('Email verified! You can now login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    try {
      await resendOTP(email);
      toast.success('OTP resent successfully!');
      setCountdown(60);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend OTP');
    }
  };

  // Handle OTP input
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-10 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-40 right-10 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute -bottom-20 left-1/2 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
      </div>

      {/* Verify OTP Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Verify Email
            </h1>
            <p className="text-gray-400">We sent a verification code to your email</p>
          </div>

          {/* Email Display */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <Mail className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs text-gray-500">Verification code sent to:</p>
              <p className="text-white font-medium">{email}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Enter 6-digit Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="w-full px-4 py-5 bg-white/5 border border-white/10 rounded-xl text-white text-center text-3xl tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                maxLength={6}
                required
              />
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Verify Code'
              )}
            </motion.button>
          </form>

          {/* Resend OTP */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-gray-400 text-sm text-center mb-4">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isLoading || countdown > 0}
              className="w-full py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${countdown > 0 ? '' : 'animate-spin-slow'}`} />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Back to Signup */}
          <div className="text-center">
            <Link
              to="/signup"
              className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign Up
            </Link>
          </div>
        </div>
      </motion.div>

      <ToastContainer />
    </div>
  );
}

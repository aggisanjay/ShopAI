

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Eye, EyeOff, Mail, Lock, User as UserIcon, Sparkles,
  Chrome, Github, ArrowLeft, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, registerUser } from '../../store/slices/authSlice.js';
import {
  closeAuthModal, setAuthTab,
  selectAuthModalOpen, selectAuthModalTab,
} from '../../store/slices/uiSlice.js';
import { selectAuthLoading } from '../../store/slices/authSlice.js';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

// ─── Password strength indicator ──────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special char', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : 'bg-obsidian-700'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span
            key={c.label}
            className={`text-[10px] flex items-center gap-1 transition-colors ${
              c.ok ? 'text-emerald-400' : 'text-obsidian-500'
            }`}
          >
            <CheckCircle2 className={`w-2.5 h-2.5 ${c.ok ? 'fill-emerald-400' : ''}`} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────
function SocialButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-obsidian-600 hover:border-obsidian-500 hover:bg-obsidian-700/50 text-sm text-obsidian-300 hover:text-white transition-all"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ─── Forgot Password View ─────────────────────────────────────────────────
function ForgotPasswordView({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    // Call your forgot password API here
    // await authAPI.forgotPassword(email);
    await new Promise(r => setTimeout(r, 1000)); // simulate
    setLoading(false);
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-obsidian-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to login
      </button>

      {sent ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="font-display font-semibold text-white">Check your email</h3>
          <p className="text-sm text-obsidian-400">
            We've sent a reset link to <span className="text-white">{email}</span>
          </p>
          <p className="text-xs text-obsidian-500">Didn't receive it? Check spam or try again in a few minutes.</p>
        </div>
      ) : (
        <>
          <div>
            <h3 className="font-display font-semibold text-white text-lg">Forgot your password?</h3>
            <p className="text-sm text-obsidian-400 mt-1">Enter your email and we'll send a reset link.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button type="submit" fullWidth loading={loading}>
              Send Reset Link
            </Button>
          </form>
        </>
      )}
    </motion.div>
  );
}

// ─── Main Auth Modal ──────────────────────────────────────────────────────
export default function AuthModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectAuthModalOpen);
  const activeTab = useSelector(selectAuthModalTab);
  const isLoading = useSelector(selectAuthLoading);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: null }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (activeTab === 'register') {
      if (!form.name.trim()) errs.name = 'Name is required';
      else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    }
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setServerError('');
    const action = activeTab === 'login' ? loginUser : registerUser;
    const result = await dispatch(action(form));
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(closeAuthModal());
      setForm({ name: '', email: '', password: '' });
      setErrors({});
    } else if (result.payload) {
      setServerError(result.payload);
    }
  };

  const switchTab = (tab) => {
    dispatch(setAuthTab(tab));
    setErrors({});
    setServerError('');
    setShowForgot(false);
  };

  const handleClose = () => {
    dispatch(closeAuthModal());
    setShowForgot(false);
    setErrors({});
    setServerError('');
  };

  const handleSocialLogin = (provider) => {
    // Placeholder — wire up OAuth here
    console.log(`Login with ${provider}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="space-y-5">
        {/* Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-3 shadow-gold">
            <Sparkles className="w-6 h-6 text-obsidian-900" />
          </div>
          {!showForgot && (
            <>
              <h2 className="font-display text-2xl font-bold text-white">
                {activeTab === 'login' ? 'Welcome back' : 'Join ShopAI'}
              </h2>
              <p className="text-sm text-obsidian-400 mt-1">
                {activeTab === 'login'
                  ? 'Sign in to your account'
                  : 'Create your free account today'}
              </p>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showForgot ? (
            <ForgotPasswordView key="forgot" onBack={() => setShowForgot(false)} />
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Tabs */}
              <div className="flex bg-obsidian-800 rounded-xl p-1">
                {['login', 'register'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => switchTab(tab)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-gold-500 text-obsidian-900 shadow-sm'
                        : 'text-obsidian-400 hover:text-white'
                    }`}
                  >
                    {tab === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Social Login */}
              <div className="flex gap-3">
                <SocialButton
                  icon={Chrome}
                  label="Google"
                  onClick={() => handleSocialLogin('google')}
                />
                <SocialButton
                  icon={Github}
                  label="GitHub"
                  onClick={() => handleSocialLogin('github')}
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-obsidian-700" />
                <span className="text-xs text-obsidian-500">or continue with email</span>
                <div className="flex-1 h-px bg-obsidian-700" />
              </div>

              {/* Server error */}
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{serverError}</p>
                </motion.div>
              )}

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {activeTab === 'register' && (
                    <Input
                      label="Full Name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      icon={UserIcon}
                      value={form.name}
                      onChange={handleChange}
                      error={errors.name}
                      autoComplete="name"
                    />
                  )}

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="email"
                  />

                  <div>
                    <Input
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      icon={Lock}
                      value={form.password}
                      onChange={handleChange}
                      error={errors.password}
                      autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                      iconRight={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                    {activeTab === 'register' && (
                      <PasswordStrength password={form.password} />
                    )}
                  </div>

                  {activeTab === 'login' && (
                    <div className="text-right -mt-2">
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button type="submit" fullWidth loading={isLoading} size="lg">
                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>

                  {activeTab === 'register' && (
                    <p className="text-center text-[11px] text-obsidian-500 leading-relaxed">
                      By creating an account, you agree to our{' '}
                      <a href="/terms" className="text-gold-500 hover:text-gold-400">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-gold-500 hover:text-gold-400">Privacy Policy</a>
                    </p>
                  )}
                </motion.form>
              </AnimatePresence>

              <p className="text-center text-sm text-obsidian-400">
                {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchTab(activeTab === 'login' ? 'register' : 'login')}
                  className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
                >
                  {activeTab === 'login' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
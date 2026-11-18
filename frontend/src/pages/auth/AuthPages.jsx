import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthSplitLayout from '../../layouts/AuthSplitLayout';
import { FormInput, Button } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api/client';

function validateStrongPassword(pw) {
  if (!pw || pw.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (/\s/.test(pw)) {
    return 'Password cannot contain spaces.';
  }
  if (!/[A-Z]/.test(pw)) {
    return 'Password must include at least 1 uppercase letter (A-Z).';
  }
  if (!/[0-9]/.test(pw)) {
    return 'Password must include at least 1 number (0-9).';
  }
  return null;
}

/**
 * 1. Log In Page (Page 66)
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginCustomer, loading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const data = await loginCustomer(email, password);
      if (data.user?.role === 'admin') {
        showToast('Signed in to Admin Dashboard!');
        navigate('/admin/overview', { replace: true });
      } else {
        showToast('Welcome back to Cordova Stays!');
        navigate(from, { replace: true });
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {};
      setErrors(apiErrors);
      showToast(err.response?.data?.message || 'Invalid email or password.', 'error');
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Welcome back!"
      leftSubtitle="Your next Cordova getaway starts here."
      illustrationVariant="discover"
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Log in
      </h2>
      <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 24 }}>
        Welcome back! Enter your details to continue.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormInput
          label="Email address"
          type="email"
          placeholder="you@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email?.[0]}
          required
        />

        <FormInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
          error={errors.password?.[0]}
          required
        />

        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <Link
            to="/auth/forgot-password"
            style={{ fontSize: 12.5, fontWeight: 600, color: '#0A7F82' }}
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth disabled={loading} style={{ height: 46, marginTop: 4 }}>
          {loading ? 'Logging in...' : 'Log In'}
        </Button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#6B8585', marginTop: 8 }}>
          New to Cordova Stays?{' '}
          <Link to="/auth/register" style={{ fontWeight: 700, color: '#0A7F82' }}>
            Create an account
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

/**
 * 2. Create your account + 6-Digit Gmail OTP Verification (Page 69)
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const { registerCustomer, loading } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: ['Full name cannot be spaces only.'] });
      showToast('Full name cannot be spaces only.', 'error');
      return;
    }
    const pwError = validateStrongPassword(password);
    if (pwError) {
      setErrors({ password: [pwError] });
      showToast(pwError, 'error');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrors({ password: ['Passwords do not match.'] });
      showToast('Passwords do not match.', 'error');
      return;
    }
    try {
      const res = await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      if (res.requires_verification) {
        showToast(res.message || 'A 6-digit verification code has been sent to your Gmail!');
        setStep('otp');
      } else {
        navigate('/auth/account-created');
      }
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Please check the form for errors.', 'error');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!code.trim() || code.trim().length !== 6) {
      setErrors({ code: ['Please enter the 6-digit verification code sent to your Gmail.'] });
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }
    try {
      await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        code: code.trim(),
      });
      showToast('Email verified! Account created successfully.');
      navigate('/auth/account-created');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Invalid or expired verification code.', 'error');
    }
  };

  const handleResendOtp = async () => {
    setErrors({});
    try {
      await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      showToast('A new 6-digit code has been sent to your Gmail!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not resend verification code.', 'error');
    }
  };

  if (step === 'otp') {
    return (
      <AuthSplitLayout
        leftTitle="Verify your Gmail"
        leftSubtitle="Enter the 6-digit security code we sent to your email."
        illustrationVariant="ocean"
      >
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
          Verify your email
        </h2>
        <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 22 }}>
          We sent a 6-digit verification code to <strong>{email.trim()}</strong>.
        </p>

        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormInput
            label="6-Digit Email Code"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={errors.code?.[0]}
            required
          />

          <Button type="submit" pill fullWidth disabled={loading} style={{ height: 48 }}>
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </Button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setCode('');
                setErrors({});
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0A7F82',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ← Edit details
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#0A7F82',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Resend code
            </button>
          </div>
        </form>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      leftTitle="Plan your next stay"
      leftSubtitle="Create an account to keep your trips organized."
      illustrationVariant="discover"
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Create your account
      </h2>
      <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 22 }}>
        Sign up to manage your resort reservations.
      </p>

      <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormInput
          label="Full name"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name?.[0]}
          required
        />

        <FormInput
          label="Email address"
          type="email"
          placeholder="you@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email?.[0]}
          required
        />

        <FormInput
          label="Password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
          error={errors.password?.[0]}
          required
        />

        <FormInput
          label="Confirm password"
          placeholder="Re-enter your password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          showToggle
          required
        />

        <div style={{ fontSize: 11.5, color: '#6B8585', marginTop: -6 }}>
          Use at least 8 characters with 1 uppercase letter (A-Z), 1 number (0-9), and no spaces.
        </div>

        <Button type="submit" fullWidth disabled={loading} style={{ height: 46, marginTop: 6 }}>
          {loading ? 'Sending verification code...' : 'Create Account'}
        </Button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#6B8585', marginTop: 6 }}>
          Already have an account?{' '}
          <Link to="/auth/login" style={{ fontWeight: 700, color: '#0A7F82' }}>
            Log in
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

/**
 * 3. Account Created! Success Page (Page 70)
 */
export function AccountCreatedPage() {
  const navigate = useNavigate();

  return (
    <AuthSplitLayout
      leftTitle="Welcome back soon!"
      leftSubtitle="Your account is ready for you to planning your next stay."
      illustrationVariant="ocean"
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
          Account Created!
        </h2>
        <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 24 }}>
          Your account has been created successfully.
        </p>

        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#DDF3EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 22px',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#0B6E75',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#0F3F40', fontWeight: 500, marginBottom: 4 }}>
          Your account has been created successfully.
        </p>
        <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 28 }}>
          You can now log in with your new account.
        </p>

        <Button
          pill
          fullWidth
          onClick={() => navigate('/auth/login')}
          style={{ height: 48 }}
        >
          Continue to Log In
        </Button>
      </div>
    </AuthSplitLayout>
  );
}

/**
 * 4. Forgot Password – Step 1: Email input (Page 73)
 */
export function ForgotPasswordStep1Page() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      sessionStorage.setItem('cs_reset_email', email);
      showToast('A 6-digit verification code has been sent to your Gmail!');
      navigate('/auth/verify-code');
    } catch (err) {
      setError(err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Account not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Forgot your password?"
      leftSubtitle="Reset your password to get back to planning your next stay."
      illustrationVariant="ocean"
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
        Reset your password
      </h2>
      <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 24 }}>
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon="✉"
          error={error}
          required
        />

        <Button type="submit" pill fullWidth disabled={loading} style={{ height: 48 }}>
          {loading ? 'Sending...' : 'Enter'}
        </Button>

        <div>
          <Link
            to="/auth/login"
            style={{ fontSize: 13, fontWeight: 600, color: '#0A7F82' }}
          >
            ← Back to Log In
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

/**
 * 5. Forgot Password – Step 2: Email Code verification (Page 76)
 */
export function ForgotPasswordStep2Page() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const savedEmail = sessionStorage.getItem('cs_reset_email') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email: savedEmail, code });
      sessionStorage.setItem('cs_reset_verified_code', code);
      showToast('Code verified!');
      navigate('/auth/reset-password');
    } catch (err) {
      setError(err.response?.data?.errors?.code?.[0] || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Forgot your password?"
      leftSubtitle="Reset your password to get back to planning your next stay."
      illustrationVariant="ocean"
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
        Reset your password
      </h2>
      <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 24 }}>
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormInput
          label="Email Code"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={error}
          required
        />

        <Button type="submit" pill fullWidth disabled={loading} style={{ height: 48 }}>
          {loading ? 'Verifying...' : 'Enter'}
        </Button>

        <div>
          <Link
            to="/auth/login"
            style={{ fontSize: 13, fontWeight: 600, color: '#0A7F82' }}
          >
            ← Back to Log In
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

/**
 * 6. Create a new password (Page 79)
 */
export function CreateNewPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const savedEmail = sessionStorage.getItem('cs_reset_email') || '';
  const savedCode = sessionStorage.getItem('cs_reset_verified_code') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const pwError = validateStrongPassword(password);
    if (pwError) {
      setErrors({ password: [pwError] });
      showToast(pwError, 'error');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrors({ password: ['Passwords do not match.'] });
      showToast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: savedEmail,
        code: savedCode,
        password,
        password_confirmation: passwordConfirmation,
      });
      sessionStorage.removeItem('cs_reset_email');
      sessionStorage.removeItem('cs_reset_dev_code');
      sessionStorage.removeItem('cs_reset_verified_code');
      navigate('/auth/password-updated');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Unable to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Almost there!"
      leftSubtitle="Choose a new password to get back to planning your next stay."
      illustrationVariant="ocean"
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
        Create a new password
      </h2>
      <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 22 }}>
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormInput
          label="New password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
          error={errors.password?.[0]}
          required
        />

        <FormInput
          label="Confirm new password"
          placeholder="Re-enter new password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          showToggle
          required
        />

        <div style={{ fontSize: 12, color: '#6B8585', marginTop: -6 }}>
          Use at least 8 characters, including 1 uppercase letter, 1 number, and no spaces.
        </div>

        <Button type="submit" pill fullWidth disabled={loading} style={{ height: 48, marginTop: 4 }}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>

        <div>
          <Link
            to="/auth/login"
            style={{ fontSize: 13, fontWeight: 600, color: '#0A7F82' }}
          >
            ← Back to Log In
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

/**
 * 7. Password updated! Success Page (Page 82 -> Continue to Log In, or Page 63 -> Continue to Profile)
 */
export function PasswordUpdatedPage({ toProfile = false }) {
  const navigate = useNavigate();

  return (
    <AuthSplitLayout
      leftTitle="Welcome back soon!"
      leftSubtitle="Your account is ready for you to planning your next stay."
      illustrationVariant="ocean"
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 6 }}>
          Password updated!
        </h2>
        <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 24 }}>
          Your password has been changed successfully.
        </p>

        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#DDF3EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 22px',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#0B6E75',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#0F3F40', fontWeight: 500, marginBottom: 4 }}>
          Your password has been changed successfully.
        </p>
        <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 28 }}>
          You can now log in with your new password.
        </p>

        <Button
          pill
          fullWidth
          onClick={() => navigate(toProfile ? '/profile' : '/auth/login')}
          style={{ height: 48 }}
        >
          {toProfile ? 'Continue to Profile' : 'Continue to Log In'}
        </Button>
      </div>
    </AuthSplitLayout>
  );
}

/**
 * 8. Change password from Profile (Page 62)
 */
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const pwError = validateStrongPassword(password);
    if (pwError) {
      setErrors({ password: [pwError] });
      showToast(pwError, 'error');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrors({ password: ['Passwords do not match.'] });
      showToast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      showToast('Password updated successfully.');
      navigate('/auth/profile-password-updated');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      showToast(err.response?.data?.message || 'Could not update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      leftTitle="Keep your account secure"
      leftSubtitle="Update your password to protect your reservations."
      illustrationVariant="discover"
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
        Change password
      </h2>
      <p style={{ fontSize: 13.5, color: '#6B8585', marginBottom: 22 }}>
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email?.[0]}
          required
        />

        <FormInput
          label="New password"
          placeholder="Enter a new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
          error={errors.password?.[0]}
          required
        />

        <FormInput
          label="Confirm new password"
          placeholder="Re-enter your new password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          showToggle
          required
        />

        <Button type="submit" fullWidth disabled={loading} style={{ height: 46, marginTop: 4 }}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#6B8585', marginTop: 6 }}>
          Remembered your password?{' '}
          <Link to="/profile" style={{ fontWeight: 700, color: '#0A7F82' }}>
            Back to Profile
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

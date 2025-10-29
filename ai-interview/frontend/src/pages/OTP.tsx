import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { apiClient } from '../api';

const OTP: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const inviteDetails = JSON.parse(localStorage.getItem('inviteDetails') || '{}');
      await apiClient.sendOTP(email, inviteDetails.invite_id);
      setStep('code');
      setSuccess('OTP sent to your email. Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const inviteDetails = JSON.parse(localStorage.getItem('inviteDetails') || '{}');
      await apiClient.verifyOTP(email, inviteDetails.invite_id, otpCode);
      
      // Store verified email for later use
      localStorage.setItem('verifiedEmail', email);
      
      navigate(`/identity/${token}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const inviteDetails = JSON.parse(localStorage.getItem('inviteDetails') || '{}');
    try {
      await apiClient.sendOTP(email, inviteDetails.invite_id);
      setSuccess('New OTP sent to your email.');
      setError(null);
    } catch (err: any) {
      setError('Failed to resend OTP');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Email Verification</h1>
        <p className="mb-4">
          We need to verify your email address before proceeding with the interview.
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="code">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                className="form-input"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
              <small>
                Check your email for the 6-digit verification code. 
                Sent to: <strong>{email}</strong>
              </small>
            </div>
            
            <div className="flex justify-between items-center">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={handleResendOTP}
              >
                Resend Code
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </div>
            
            <button 
              type="button"
              className="btn btn-secondary mt-4"
              onClick={() => setStep('email')}
            >
              Change Email
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OTP;
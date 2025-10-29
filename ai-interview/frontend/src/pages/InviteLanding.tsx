import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { apiClient } from '../api';

interface InviteDetails {
  invite_id: number;
  strict_mode: boolean;
  window_start: string;
  window_end: string;
}

const InviteLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        if (!token) {
          throw new Error('Invalid token');
        }
        
        const details = await apiClient.getInviteDetails(token);
        setInviteDetails(details);
        
        // Store invite details in localStorage for use in other pages
        localStorage.setItem('inviteDetails', JSON.stringify(details));
        localStorage.setItem('inviteToken', token);
        
      } catch (err: any) {
        console.error('Token validation failed:', err);
        setError(err.response?.data?.detail || 'Invalid or expired invitation link');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleContinue = () => {
    navigate(`/consent/${token}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">
            <h2>Invitation Error</h2>
            <p>{error}</p>
            <p>Please contact the hiring team if you believe this is an error.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteDetails) {
    return null;
  }

  const windowStart = new Date(inviteDetails.window_start);
  const windowEnd = new Date(inviteDetails.window_end);
  const now = new Date();

  return (
    <div className="container">
      <div className="card">
        <div className="text-center">
          <h1>Welcome to AI Interview Platform</h1>
          <p className="mb-4">
            You have been invited to participate in an AI-powered interview.
          </p>
        </div>

        <div className="mb-4">
          <h3>Interview Window</h3>
          <p><strong>Start:</strong> {windowStart.toLocaleString()}</p>
          <p><strong>End:</strong> {windowEnd.toLocaleString()}</p>
          <p><strong>Current Time:</strong> {now.toLocaleString()}</p>
          
          {inviteDetails.strict_mode && (
            <div className="alert alert-warning">
              <strong>Strict Mode Enabled:</strong> This interview has enhanced timing requirements 
              and monitoring. Please ensure you are ready to complete the full interview without interruption.
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3>Before You Begin</h3>
          <ul>
            <li>Ensure you have a stable internet connection</li>
            <li>Test your microphone and camera</li>
            <li>Find a quiet, well-lit space</li>
            <li>Have your resume ready for reference</li>
            <li>Allow approximately 30-45 minutes for the interview</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3>Interview Format</h3>
          <ul>
            <li>Questions will be displayed as text</li>
            <li>You will answer using voice (speech-to-text)</li>
            <li>Each question has a time limit</li>
            <li>Follow-up questions are generated based on your responses</li>
            <li>The interview session is monitored for integrity</li>
          </ul>
        </div>

        <div className="alert alert-warning">
          <p><strong>Important:</strong> You can only take this interview once during the specified window. 
          Make sure you are ready before proceeding.</p>
        </div>

        <div className="text-center mt-4">
          <button 
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={now < windowStart || now > windowEnd}
          >
            {now < windowStart 
              ? 'Interview Not Yet Available'
              : now > windowEnd 
                ? 'Interview Window Expired'
                : 'Continue to Interview Setup'
            }
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default InviteLanding;
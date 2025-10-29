import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const Consent: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate(`/env/${token}`);
  };

  const handleDecline = () => {
    // Redirect to a thank you page or close window
    window.location.href = 'about:blank';
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Interview Consent & Privacy Notice</h1>
        
        <div className="mb-4">
          <h3>Proctoring & Monitoring</h3>
          <p>This interview session will be monitored for integrity purposes. The following will be tracked:</p>
          <ul>
            <li>Browser tab activity (switching tabs)</li>
            <li>Camera feed for identity verification</li>
            <li>Audio recording of your responses</li>
            <li>Screen activity and focus</li>
            <li>Timing of responses</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3>Data Collection & Retention</h3>
          <p>Your interview data will include:</p>
          <ul>
            <li>Voice recordings and transcriptions of your answers</li>
            <li>Video snapshots for identity verification</li>
            <li>Response timing and behavioral metrics</li>
            <li>Evaluation scores and feedback</li>
          </ul>
          <p>
            This data will be retained for 60 days for evaluation purposes and then permanently deleted. 
            Your data is used solely for interview assessment and will not be shared with third parties.
          </p>
        </div>

        <div className="mb-4">
          <h3>Technical Requirements</h3>
          <p>By proceeding, you confirm that:</p>
          <ul>
            <li>You grant permission to access your microphone and camera</li>
            <li>You are in a private, quiet environment</li>
            <li>You will not use external assistance or resources</li>
            <li>You understand that suspicious activity may invalidate your interview</li>
          </ul>
        </div>

        <div className="mb-4">
          <h3>Privacy Policy</h3>
          <p>
            For complete details about data handling, please review our{' '}
            <a href="https://example.com/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>.
          </p>
        </div>

        <div className="alert alert-warning">
          <p>
            <strong>Important:</strong> By clicking "Accept & Continue", you consent to the monitoring 
            and data collection described above. If you do not agree, please click "Decline".
          </p>
        </div>

        <div className="flex justify-between mt-4">
          <button 
            className="btn btn-secondary" 
            onClick={handleDecline}
          >
            Decline
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleAccept}
          >
            Accept & Continue
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Consent;
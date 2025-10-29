import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { apiClient } from '../api';

const Identity: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: false 
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setError('Camera access required for identity verification');
    }
  };

  const handleVerifyLiveness = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate liveness check with basic metrics
      const metrics = {
        confidence: 0.9,
        timestamp: Date.now(),
        camera_present: !!stream
      };

      const result = await apiClient.verifyLiveness(undefined, metrics);
      
      if (result.verified) {
        setVerified(true);
        setTimeout(() => {
          handleStartInterview();
        }, 1000);
      } else {
        setError('Liveness verification failed. Please try again.');
      }
    } catch (err: any) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    try {
      const inviteDetails = JSON.parse(localStorage.getItem('inviteDetails') || '{}');
      const verifiedEmail = localStorage.getItem('verifiedEmail');
      
      if (!inviteDetails.invite_id || !verifiedEmail) {
        setError('Missing verification details. Please restart the process.');
        return;
      }

      // Stop camera before starting interview
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Start session with invite ID (backend will resolve candidate and job from invite)
      const sessionResponse = await apiClient.startSession(inviteDetails.invite_id);

      // Store session details
      localStorage.setItem('sessionDetails', JSON.stringify(sessionResponse));
      
      navigate(`/interview/${token}`);
    } catch (err: any) {
      setError('Failed to start interview session');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Identity Verification</h1>
        <p className="mb-4">
          Please verify your identity using the camera. Look directly at the camera and follow the instructions.
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="camera-preview mb-4">
          <video 
            ref={videoRef}
            autoPlay
            muted
            style={{ width: '100%', maxWidth: '640px', borderRadius: '8px' }}
          />
        </div>

        <div className="text-center">
          {!verified ? (
            <>
              <p className="mb-4">
                Position your face in the center of the frame and click "Verify Identity" when ready.
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleVerifyLiveness}
                disabled={loading || !stream}
              >
                {loading ? 'Verifying...' : 'Verify Identity'}
              </button>
            </>
          ) : (
            <div className="alert alert-success">
              <p>✓ Identity verified successfully!</p>
              <p>Starting your interview...</p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3>Instructions</h3>
          <ul>
            <li>Ensure good lighting on your face</li>
            <li>Look directly at the camera</li>
            <li>Remove sunglasses or hat if wearing</li>
            <li>Make sure you are the only person visible</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Identity;
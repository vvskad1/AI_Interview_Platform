import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const EnvCheck: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micLevel, setMicLevel] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const testMicrophone = async () => {
    try {
      setTesting(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      setMicPermission('granted');
      setStream(mediaStream);

      // Create audio context to measure volume
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      microphone.connect(analyser);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(Math.floor(average));
        
        if (micPermission === 'granted') {
          requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();

      // Stop after 5 seconds
      setTimeout(() => {
        audioContext.close();
        mediaStream.getTracks().forEach(track => track.stop());
        setMicLevel(0);
        setTesting(false);
      }, 5000);

    } catch (err) {
      console.error('Microphone access denied:', err);
      setMicPermission('denied');
      setTesting(false);
    }
  };

  const testCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      setCameraPermission('granted');
      
      // Stop camera stream immediately after test
      setTimeout(() => {
        mediaStream.getTracks().forEach(track => track.stop());
      }, 1000);

    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraPermission('denied');
    }
  };

  const handleContinue = () => {
    navigate(`/otp/${token}`);
  };

  const canContinue = micPermission === 'granted' && cameraPermission === 'granted';

  return (
    <div className="container">
      <div className="card">
        <h1>Environment Check</h1>
        <p className="mb-4">
          We need to test your microphone and camera to ensure the interview runs smoothly.
        </p>

        {/* Microphone Test */}
        <div className="mb-4">
          <h3>Microphone Test</h3>
          <div className="flex items-center gap-4 mb-2">
            <button 
              className="btn btn-primary"
              onClick={testMicrophone}
              disabled={testing}
            >
              {testing ? 'Testing...' : 'Test Microphone'}
            </button>
            
            <div className="flex items-center gap-2">
              Status: 
              {micPermission === 'pending' && <span>Not tested</span>}
              {micPermission === 'granted' && <span style={{ color: 'green' }}>✓ Working</span>}
              {micPermission === 'denied' && <span style={{ color: 'red' }}>✗ Access denied</span>}
            </div>
          </div>
          
          {testing && (
            <div>
              <p>Speak now to test your microphone...</p>
              <div 
                style={{ 
                  width: '100%', 
                  height: '20px', 
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{ 
                    width: `${Math.min(micLevel * 2, 100)}%`, 
                    height: '100%', 
                    backgroundColor: micLevel > 20 ? '#28a745' : '#ffc107',
                    transition: 'width 0.1s'
                  }}
                />
              </div>
            </div>
          )}
          
          {micPermission === 'denied' && (
            <div className="alert alert-error">
              Microphone access is required for the interview. 
              Please enable microphone permissions and try again.
            </div>
          )}
        </div>

        {/* Camera Test */}
        <div className="mb-4">
          <h3>Camera Test</h3>
          <div className="flex items-center gap-4 mb-2">
            <button 
              className="btn btn-primary"
              onClick={testCamera}
            >
              Test Camera
            </button>
            
            <div className="flex items-center gap-2">
              Status: 
              {cameraPermission === 'pending' && <span>Not tested</span>}
              {cameraPermission === 'granted' && <span style={{ color: 'green' }}>✓ Working</span>}
              {cameraPermission === 'denied' && <span style={{ color: 'red' }}>✗ Access denied</span>}
            </div>
          </div>
          
          {cameraPermission === 'denied' && (
            <div className="alert alert-error">
              Camera access is required for identity verification. 
              Please enable camera permissions and try again.
            </div>
          )}
        </div>

        {/* Environment Checklist */}
        <div className="mb-4">
          <h3>Environment Checklist</h3>
          <p>Please confirm the following:</p>
          <ul>
            <li>You are in a quiet, private space</li>
            <li>Good lighting on your face</li>
            <li>Stable internet connection</li>
            <li>No other people visible in the camera</li>
            <li>Browser notifications are disabled</li>
            <li>Other applications are closed</li>
          </ul>
        </div>

        {canContinue ? (
          <div className="alert alert-success">
            <p>✓ All checks passed! You're ready to continue.</p>
          </div>
        ) : (
          <div className="alert alert-warning">
            <p>Please complete all environment checks before continuing.</p>
          </div>
        )}

        <div className="text-center mt-4">
          <button 
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue to Identity Verification
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EnvCheck;
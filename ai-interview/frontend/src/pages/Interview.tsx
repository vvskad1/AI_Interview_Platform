import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Timer from '../components/Timer';
import SpeechAnswer from '../components/SpeechAnswer';
import Footer from '../components/layout/Footer';
import { apiClient } from '../api';

interface SessionData {
  session_id: number;
  question: string;
  turn_idx: number;
  answer_seconds: number;
  buffer_seconds: number;
  deadline_utc: string;
}

interface InterviewState {
  currentQuestion: string;
  turnIdx: number;
  sessionId: number;
  timeLeft: number;
  isBuffering: boolean;
  bufferTimeLeft: number;
  completed: boolean;
  transcript: string;
  score?: number;
  showAt?: Date;
}

const Interview: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeInterview();
    setupProctoring();
  }, []);

  const initializeInterview = () => {
    try {
      const sessionDetails = JSON.parse(localStorage.getItem('sessionDetails') || '{}');
      
      if (!sessionDetails.session_id) {
        setError('No session found. Please restart the interview process.');
        return;
      }

      const deadline = new Date(sessionDetails.deadline_utc);
      const now = new Date();
      const timeLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

      setInterviewState({
        currentQuestion: sessionDetails.question,
        turnIdx: sessionDetails.turn_idx,
        sessionId: sessionDetails.session_id,
        timeLeft,
        isBuffering: false,
        bufferTimeLeft: 0,
        completed: false,
        transcript: ''
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize interview session');
      setLoading(false);
    }
  };

  const setupProctoring = () => {
    // Tab visibility monitoring
    const handleVisibilityChange = () => {
      if (document.hidden && interviewState?.sessionId) {
        apiClient.recordProctorEvent(interviewState.sessionId, 'tab_hidden', false, {
          timestamp: Date.now()
        }).catch(console.error);
      } else if (!document.hidden && interviewState?.sessionId) {
        apiClient.recordProctorEvent(interviewState.sessionId, 'tab_visible', true, {
          timestamp: Date.now()
        }).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  const handleSpeechResult = (result: any) => {
    if (!interviewState) return;

    setInterviewState(prev => ({
      ...prev!,
      transcript: result.transcript,
      score: result.score
    }));

    if (result.complete) {
      // Interview completed
      setInterviewState(prev => ({
        ...prev!,
        completed: true
      }));
    } else if (result.next_question) {
      // Start buffer period
      const showAtTime = new Date(result.show_at_utc);
      const bufferSeconds = Math.max(0, Math.floor((showAtTime.getTime() - Date.now()) / 1000));
      
      setInterviewState(prev => ({
        ...prev!,
        isBuffering: true,
        bufferTimeLeft: bufferSeconds,
        showAt: showAtTime
      }));

      // Set timer to show next question
      setTimeout(() => {
        setInterviewState(prev => ({
          ...prev!,
          currentQuestion: result.next_question,
          turnIdx: result.next_turn_idx,
          timeLeft: result.answer_seconds,
          isBuffering: false,
          bufferTimeLeft: 0,
          transcript: ''
        }));
      }, bufferSeconds * 1000);
    }
  };

  const handleTimeout = async () => {
    if (!interviewState) return;

    try {
      const result = await apiClient.submitTimeout(interviewState.sessionId, interviewState.turnIdx);
      
      if (result.complete) {
        setInterviewState(prev => ({
          ...prev!,
          completed: true
        }));
      } else {
        // Handle next question after timeout
        handleSpeechResult(result);
      }
    } catch (err) {
      console.error('Failed to handle timeout:', err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!interviewState) {
    return null;
  }

  if (interviewState.completed) {
    return (
      <div className="container">
        <div className="card text-center">
          <h1>Interview Completed</h1>
          <p className="mb-4">
            Thank you for completing the interview. Your responses have been recorded and will be reviewed by our team.
          </p>
          {interviewState.transcript && (
            <div className="mb-4">
              <h3>Your Last Response:</h3>
              <p style={{ fontStyle: 'italic', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                "{interviewState.transcript}"
              </p>
              {/* Score hidden from candidate view */}
            </div>
          )}
          <p>You may now close this browser window.</p>
        </div>
      </div>
    );
  }

  if (interviewState.isBuffering) {
    return (
      <div className="container">
        <div className="card text-center">
          <h2>Processing Your Response</h2>
          <div className="mb-4">
            <div className="loading">
              <div className="spinner"></div>
              <p>Generating next question...</p>
            </div>
          </div>
          <p>Next question will appear in {interviewState.bufferTimeLeft} seconds</p>
          {interviewState.transcript && (
            <div className="mt-4">
              <h4>Your Response:</h4>
              <p style={{ fontStyle: 'italic', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                "{interviewState.transcript}"
              </p>
              {/* Score hidden from candidate view */}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="text-center mb-4">
          <h1>Interview in Progress</h1>
          <p>Question {interviewState.turnIdx}</p>
        </div>

        <Timer 
          seconds={interviewState.timeLeft}
          onEnd={handleTimeout}
          warning={30}
          danger={10}
        />

        <div className="card mb-4" style={{ backgroundColor: '#f8f9fa' }}>
          <h3>Question:</h3>
          <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
            {interviewState.currentQuestion}
          </p>
        </div>

        <SpeechAnswer
          sessionId={interviewState.sessionId}
          question={interviewState.currentQuestion}
          turnIdx={interviewState.turnIdx}
          onResult={handleSpeechResult}
          onError={(error) => setError(error)}
        />

        <div className="alert alert-warning mt-4">
          <p><strong>Remember:</strong></p>
          <ul>
            <li>Answer clearly and concisely</li>
            <li>Stay within the time limit</li>
            <li>Do not switch browser tabs</li>
            <li>Speak directly into your microphone</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Interview;
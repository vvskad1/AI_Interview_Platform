import React, { useState, useRef } from 'react';

interface SpeechAnswerProps {
  sessionId: number;
  question: string;
  turnIdx: number;
  onResult: (result: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const SpeechAnswer: React.FC<SpeechAnswerProps> = ({
  sessionId,
  question,
  turnIdx,
  onResult,
  onError,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const startRecording = async () => {
    if (disabled || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await submitAudio(audioBlob);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start audio level monitoring
      updateAudioLevel();

    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setAudioLevel(0);
    setProcessing(true);
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(Math.min(average / 128, 1));

    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const submitAudio = async (audioBlob: Blob) => {
    try {
      // Import API client dynamically to avoid module issues during build
      const { apiClient } = await import('../api');
      
      const result = await apiClient.submitSpeech(sessionId, audioBlob, question, turnIdx);
      onResult(result);
    } catch (error) {
      console.error('Failed to submit audio:', error);
      onError?.('Failed to submit audio. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleMouseDown = () => {
    startRecording();
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  const getRecordButtonClass = () => {
    if (processing) return 'record-button processing';
    if (isRecording) return 'record-button recording';
    return 'record-button idle';
  };

  const getRecordButtonText = () => {
    if (processing) return 'Processing...';
    if (isRecording) return 'Release to Stop';
    return 'Hold to Answer';
  };

  return (
    <div className="speech-recorder">
      <div className="mb-4">
        <button
          className={getRecordButtonClass()}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Stop if mouse leaves button
          disabled={disabled || processing}
          style={{
            transform: isRecording ? `scale(${1 + audioLevel * 0.1})` : 'scale(1)',
            transition: processing ? 'all 0.3s ease' : 'transform 0.1s ease'
          }}
        >
          {getRecordButtonText()}
        </button>
      </div>

      {isRecording && (
        <div className="mb-4">
          <p>🎤 Recording in progress...</p>
          <div 
            style={{
              width: '200px',
              height: '4px',
              backgroundColor: '#f0f0f0',
              borderRadius: '2px',
              margin: '8px auto',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${audioLevel * 100}%`,
                height: '100%',
                backgroundColor: audioLevel > 0.3 ? '#28a745' : '#ffc107',
                transition: 'width 0.1s ease',
                borderRadius: '2px'
              }}
            />
          </div>
        </div>
      )}

      {processing && (
        <div className="mb-4">
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing your answer...</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <small style={{ color: '#666' }}>
          Press and hold the button while speaking your answer
        </small>
      </div>
    </div>
  );
};

export default SpeechAnswer;
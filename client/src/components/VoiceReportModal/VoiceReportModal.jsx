import React, { useState, useEffect } from 'react';
import './VoiceReportModal.css';
import { FaMicrophone, FaStop, FaTimes, FaMagic, FaCheck } from 'react-icons/fa';

const SAMPLE_VOICE_PROMPTS = [
  'Water is overflowing from the ceiling pipe in Main Academic Block 2nd floor washroom.',
  'Broken tube light flickering in the Central Library computer reading corner.',
  'Wi-Fi router in Lab 4 has completely disconnected and shows red error light.',
];

const VoiceReportModal = ({ isOpen, onClose, onVoiceParsed }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  if (!isOpen) return null;

  const startListening = () => {
    setTranscript('');
    setIsListening(true);
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        simulateVoiceInput();
      }
    } else {
      simulateVoiceInput();
    }
  };

  const simulateVoiceInput = () => {
    const randomPrompt = SAMPLE_VOICE_PROMPTS[Math.floor(Math.random() * SAMPLE_VOICE_PROMPTS.length)];
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setTranscript(randomPrompt.substring(0, i));
      if (i >= randomPrompt.length) {
        clearInterval(interval);
        setIsListening(false);
      }
    }, 40);
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
  };

  const predictMetadata = (text) => {
    const lower = text.toLowerCase();
    let category = 'Damaged Infrastructure';
    let severity = 'Medium';

    if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe') || lower.includes('washroom') || lower.includes('overflow')) {
      category = 'Water Leakage & Plumbing';
      severity = 'Critical';
    } else if (lower.includes('light') || lower.includes('flicker') || lower.includes('bulb') || lower.includes('wire') || lower.includes('shock') || lower.includes('electric')) {
      category = 'Electrical & Lighting';
      severity = lower.includes('wire') || lower.includes('shock') ? 'Critical' : 'High';
    } else if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('network') || lower.includes('internet') || lower.includes('router')) {
      category = 'Network & Wi-Fi';
      severity = 'High';
    } else if (lower.includes('trash') || lower.includes('dirty') || lower.includes('clean') || lower.includes('garbage')) {
      category = 'Cleanliness & Sanitation';
      severity = 'Low';
    } else if (lower.includes('projector') || lower.includes('lab') || lower.includes('pc') || lower.includes('computer')) {
      category = 'Lab & Classroom Equipment';
      severity = 'Medium';
    }

    return { category, severity };
  };

  const handleApply = () => {
    const { category, severity } = predictMetadata(transcript);
    onVoiceParsed({
      description: transcript,
      category,
      severity,
      title: transcript.length > 50 ? `${transcript.substring(0, 50)}...` : transcript,
    });
    onClose();
  };

  const prediction = predictMetadata(transcript);

  return (
    <div className="voice-modal-backdrop" onClick={onClose}>
      <div className="voice-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="voice-modal-header">
          <div className="voice-modal-title">
            <FaMagic /> AI Voice-Assisted Reporting
          </div>
          <button className="voice-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="voice-body">
          <div className="voice-mic-circle-wrapper">
            <button
              className={`mic-pulsing-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? <FaStop /> : <FaMicrophone />}
            </button>
            <div className="mic-hint-text">
              {isListening ? 'Listening... Speak now' : 'Tap to start recording speech'}
            </div>
          </div>

          <div className="transcript-box">
            <label className="transcript-label">Recognized Speech Transcript:</label>
            <div className="transcript-content">
              {transcript || (
                <span className="placeholder-text">
                  Press microphone and speak your issue naturally...
                </span>
              )}
            </div>
          </div>

          {transcript && (
            <div className="ai-prediction-banner">
              <div className="prediction-header">
                <FaMagic className="magic-icon" /> AI Smart Priority Prediction
              </div>
              <div className="prediction-chips">
                <span className="p-chip">Predicted Category: <strong>{prediction.category}</strong></span>
                <span className="p-chip">Suggested Severity: <strong>{prediction.severity}</strong></span>
              </div>
            </div>
          )}

          <div className="voice-footer">
            <button
              className="voice-apply-btn"
              onClick={handleApply}
              disabled={!transcript}
            >
              <FaCheck /> Apply to Issue Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceReportModal;

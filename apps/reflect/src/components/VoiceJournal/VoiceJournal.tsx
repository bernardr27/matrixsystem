'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { transcribeAudio } from '@/app/actions-audio';
import styles from './VoiceJournal.module.css';

interface VoiceEntry {
  id: string;
  text: string;
  timestamp: Date;
  duration?: number;
}

export default function VoiceJournal() {
  const [entries, setEntries] = useState<VoiceEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionActive) {
      // Timer counts total session duration including recording
      timerRef.current = setInterval(() => {
        setTotalDuration(d => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionActive]);

  useEffect(() => {
    // Auto-scroll to bottom when new entries added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, currentText]);

  async function handleToggleRecording() {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      setIsTranscribing(true);

      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        const result = await transcribeAudio(formData);

        if (result.success && result.text) {
          const newEntry: VoiceEntry = {
            id: Date.now().toString(),
            text: result.text,
            timestamp: new Date(),
          };

          setEntries(prev => [...prev, newEntry]);
          setCurrentText('');
        } else {
          console.error('Transcription failed:', result.error);
          setCurrentText('⚠️ Transcription failed. Try again.');
        }
      } catch (error) {
        console.error('Voice recording error:', error);
        setCurrentText('⚠️ Error processing audio.');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      if (!sessionActive) {
        setSessionActive(true);
      }
      setCurrentText('🎤 Recording...');
      startRecording();
    }
  }

  function handleEndSession() {
    setSessionActive(false);
    setTotalDuration(0);

    // Save entries to API
    if (entries.length > 0) {
      saveJournalSession(entries);
    }
  }

  async function saveJournalSession(sessionEntries: VoiceEntry[]) {
    try {
      const combinedText = sessionEntries.map(e => e.text).join(' ');

      // Save as a reflection session
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: combinedText,
          mode: 'mindset',
          mood: 'neutral'
        })
      });

      if (response.ok) {
        const data = await response.json();
        

        // Clear entries
        setEntries([]);
        alert('Voice journal saved! 🎉');
      }
    } catch (error) {
      console.error('Failed to save voice journal:', error);
      alert('Could not save journal. Please try again.');
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>🎙️</span>
            Voice Journal
          </h2>
          <p className={styles.subtitle}>
            Speak freely, we'll capture your thoughts as you go
          </p>
        </div>
        {sessionActive && (
          <div className={styles.sessionInfo}>
            <div className={styles.sessionStats}>
              <span className={styles.duration}>
                <span className={styles.durationIcon}>⏱️</span>
                {formatDuration(totalDuration)}
              </span>
              <span className={styles.entryCount}>
                <span className={styles.entryIcon}>📝</span>
                {entries.length} thoughts
              </span>
            </div>
            <div className={styles.recordingIndicator}>
              {isRecording && (
                <div className={styles.recordingPulse}>
                  <span className={styles.recordingDot}></span>
                  <span className={styles.recordingText}>Recording</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.stream} ref={scrollRef}>
        {entries.length === 0 && !sessionActive ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎤</div>
            <h3 className={styles.emptyTitle}>Ready to capture your thoughts?</h3>
            <p className={styles.emptyText}>
              Press the microphone to start. Speak naturally—pause when you need to think.
              We'll transcribe everything and save it as a reflection.
            </p>
            <div className={styles.emptyTips}>
              <div className={styles.emptyTip}>
                <span className={styles.emptyTipIcon}>💡</span>
                <span>Record in short bursts for better transcription</span>
              </div>
              <div className={styles.emptyTip}>
                <span className={styles.emptyTipIcon}>🎯</span>
                <span>Focus on one topic or let your mind wander</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {entries.map((entry, i) => (
              <div key={entry.id} className={`${styles.entry} ${styles.entryAnimated}`}>
                <div className={styles.entryHeader}>
                  <div className={styles.entryMeta}>
                    <span className={styles.entryNum}>#{i + 1}</span>
                    <span className={styles.entryTime}>
                      {entry.timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className={styles.entryActions}>
                    <button
                      className={styles.entryAction}
                      onClick={() => {
                        navigator.clipboard.writeText(entry.text);
                        // Could add toast notification here
                      }}
                      title="Copy text"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className={styles.entryContent}>
                  <p className={styles.entryText}>{entry.text}</p>
                  {entry.duration && (
                    <span className={styles.entryDuration}>
                      {entry.duration}s
                    </span>
                  )}
                </div>
              </div>
            ))}

            {currentText && (
              <div className={`${styles.entry} ${styles.entryCurrent} ${isTranscribing ? styles.entryTranscribing : ''}`}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryNum}>#{entries.length + 1}</span>
                  {isTranscribing && (
                    <div className={styles.transcribingIndicator}>
                      <div className={styles.transcribingSpinner}></div>
                      <span>Transcribing...</span>
                    </div>
                  )}
                </div>
                <div className={styles.entryContent}>
                  <p className={styles.entryText}>
                    {isRecording ? (
                      <>
                        <span className={styles.recordingWave}>🎤</span>
                        {currentText}
                      </>
                    ) : isTranscribing ? (
                      <>
                        <span className={styles.transcribingIcon}>⚡</span>
                        {currentText}
                      </>
                    ) : (
                      currentText
                    )}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.mainControls}>
          <button
            className={`${styles.recordBtn} ${isRecording ? styles.recordBtnActive : ''} ${isTranscribing ? styles.recordBtnDisabled : ''}`}
            onClick={handleToggleRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <div className={styles.btnContent}>
                <span className={styles.btnSpinner}></span>
                <span>Processing...</span>
              </div>
            ) : isRecording ? (
              <div className={styles.btnContent}>
                <span className={styles.btnIcon}>⏸️</span>
                <span>Pause</span>
              </div>
            ) : (
              <div className={styles.btnContent}>
                <span className={styles.btnIcon}>🎤</span>
                <span>{sessionActive ? 'Continue Recording' : 'Start Recording'}</span>
              </div>
            )}
          </button>

          {sessionActive && (
            <button
              className={`${styles.endBtn} ${isRecording || isTranscribing ? styles.endBtnDisabled : ''}`}
              onClick={handleEndSession}
              disabled={isRecording || isTranscribing}
            >
              <div className={styles.btnContent}>
                <span className={styles.btnIcon}>✅</span>
                <span>Complete Session</span>
              </div>
            </button>
          )}
        </div>

        {sessionActive && (
          <div className={styles.sessionTips}>
            <div className={styles.sessionTip}>
              <span className={styles.sessionTipIcon}>💡</span>
              <span>Pause anytime to collect your thoughts</span>
            </div>
            <div className={styles.sessionTip}>
              <span className={styles.sessionTipIcon}>💾</span>
              <span>All entries auto-save when you complete</span>
            </div>
            <div className={styles.sessionTip}>
              <span className={styles.sessionTipIcon}>🎯</span>
              <span>Focus on what's most alive for you right now</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

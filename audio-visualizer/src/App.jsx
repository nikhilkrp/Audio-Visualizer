import { useState } from "react";
import CircularVisualizer from "./components/CircularVisualizer";
import LiveTranscription from "./components/LiveTranscription";
import "./App.css";

function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1 className="title">🎵 Audio Transcription Studio</h1>
        <p className="subtitle">
          Real-time audio visualization and speech-to-text conversion
        </p>
      </header>

      {/* Main content */}
      <main className="main-content">
        {!started ? (
          <div className="start-screen">
            <div className="start-card">
              <div className="icon-wrapper">
                <span className="icon">🎤</span>
              </div>
              <h2>Welcome to Audio Studio</h2>
              <p>
                This app will access your microphone to visualize audio
                frequencies and transcribe your speech in real-time.
              </p>
              <button onClick={() => setStarted(true)} className="start-button">
                Start Recording
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Visualizer Section */}
            <section className="visualizer-section">
              <h3 className="section-title">Audio Frequency Visualizer</h3>
              <CircularVisualizer />
            </section>

            {/* Transcription Section */}
            <section className="transcription-section">
              <LiveTranscription />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built with React, Web Audio API & WebSockets</p>
      </footer>
    </div>
  );
}

export default App;

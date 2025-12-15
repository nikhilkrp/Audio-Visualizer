import { useEffect, useRef, useState } from "react";

export default function LiveTranscription() {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let ws;
    let mediaRecorder;

    async function setupConnection() {
      try {
        ws = new WebSocket("ws://localhost:8080");
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Connected to server");
          setStatus("Connected");
          setIsConnected(true);

          startAudioStream();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "transcript") {
              setTranscript((prev) => {
                if (prev === "") return data.text;
                return prev + " " + data.text;
              });
            } else if (data.type === "status") {
              setStatus(data.message);
            } else if (data.type === "error") {
              console.error("Server error:", data.message);
            }
          } catch (err) {
            console.error("Error parsing message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setStatus("Connection error");
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log(" Disconnected from server");
          setStatus("Disconnected");
          setIsConnected(false);
        };

      } catch (error) {
        console.error("Setup error:", error);
        setStatus("Failed to connect");
      }
    }

    async function startAudioStream() {
      try {
      
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000, 
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        streamRef.current = stream;

        mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data);
          }
        };

        mediaRecorder.start(500);
        setStatus("🎤 Listening...");

      } catch (error) {
        console.error("Audio stream error:", error);
        setStatus("Microphone access denied");
      }
    }

    setupConnection();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleClear = () => {
    setTranscript("");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "700px",
        margin: "0 auto",
        padding: "24px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)",
        border: "1px solid rgba(75, 85, 99, 0.3)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#f3f4f6", fontSize: "20px" }}>
            Real-Time Transcription
          </h2>
          <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "13px" }}>
            {status}
          </p>
        </div>

        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: isConnected ? "#10b981" : "#ef4444",
            boxShadow: isConnected
              ? "0 0 10px #10b981"
              : "0 0 10px #ef4444",
            animation: isConnected ? "pulse 2s infinite" : "none",
          }}
        />
      </div>

      <div
        style={{
          minHeight: "200px",
          maxHeight: "400px",
          overflowY: "auto",
          padding: "20px",
          borderRadius: "12px",
          background: "rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(75, 85, 99, 0.2)",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            color: "#e5e7eb",
            fontSize: "16px",
            lineHeight: "1.8",
            margin: 0,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {transcript || "Waiting for audio..."}
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleClear}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "rgba(239, 68, 68, 0.2)",
            color: "#fca5a5",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "rgba(239, 68, 68, 0.3)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "rgba(239, 68, 68, 0.2)";
          }}
        >
          Clear Transcript
        </button>

        <button
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: isConnected
              ? "rgba(34, 197, 94, 0.2)"
              : "rgba(107, 114, 128, 0.2)",
            color: isConnected ? "#86efac" : "#9ca3af",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "default",
          }}
        >
          {isConnected ? " Live" : " Offline"}
        </button>
      </div>

 
      <p
        style={{
          marginTop: "16px",
          fontSize: "12px",
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        Speak clearly into your microphone for best results
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
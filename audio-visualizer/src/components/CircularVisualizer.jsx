import { useEffect, useRef } from "react";

export default function CircularVisualizer() {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let dataArray;

    async function setupAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.85;

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyserRef.current = analyser;

        draw();
      } catch (err) {
        console.error("Mic permission denied:", err);
      }
    }

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas || !analyserRef.current) return;

      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;

      animationRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArray);

      // Background fade (trail effect)
      ctx.fillStyle = "rgba(17,24,39,0.25)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = 100;

      // Outer glow
      const glow = ctx.createRadialGradient(
        cx,
        cy,
        baseRadius - 20,
        cx,
        cy,
        baseRadius + 60
      );
      glow.addColorStop(0, "rgba(59,130,246,0.3)");
      glow.addColorStop(0.5, "rgba(139,92,246,0.2)");
      glow.addColorStop(1, "rgba(236,72,153,0)");

      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius + 30, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Base circle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(148,163,184,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Frequency bars
      dataArray.forEach((value, i) => {
        const angle = (i / dataArray.length) * Math.PI * 2 - Math.PI / 2;
        const barLength = (value / 255) * 80;

        const x1 = cx + Math.cos(angle) * baseRadius;
        const y1 = cy + Math.sin(angle) * baseRadius;
        const x2 = cx + Math.cos(angle) * (baseRadius + barLength);
        const y2 = cy + Math.sin(angle) * (baseRadius + barLength);

        const hue = (i / dataArray.length) * 360 + Date.now() / 60;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsl(${hue % 360}, 85%, 60%)`;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.stroke();
      });

      ctx.shadowBlur = 0;

      // Center icon
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎤", cx, cy);
    }

    setupAudio();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContext) audioContext.close();
    };
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, #1f2937 0%, #111827 100%)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}




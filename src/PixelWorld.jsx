import { useRef, useEffect, useState } from 'react';

const PIXEL_SIZE = 4;
const COLS = 160;
const ROWS = 90;

export default function PixelWorld() {
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#e94560');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = COLS * PIXEL_SIZE;
    canvas.height = ROWS * PIXEL_SIZE;
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawPixel = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      drawPixel(x, y);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Pixel World</h1>
      <div style={styles.controls}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={styles.colorPicker}
        />
        <button onClick={clear} style={styles.button}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={styles.canvas}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#1a1a2e',
    fontFamily: "'Courier New', monospace",
    padding: '20px',
  },
  title: {
    color: '#e94560',
    textShadow: '0 0 10px #e94560',
    marginBottom: '10px',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  colorPicker: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  button: {
    padding: '8px 16px',
    background: '#0f3460',
    color: '#fff',
    border: '1px solid #e94560',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
  },
  canvas: {
    border: '2px solid #0f3460',
    background: '#16213e',
    boxShadow: '0 0 20px rgba(15, 52, 96, 0.5)',
    imageRendering: 'pixelated',
    cursor: 'crosshair',
  },
};
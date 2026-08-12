import React, { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../context/Playercontext';

export function AudioVisualizer() {
  const { analyserRef, isPlaying } = useContext(PlayerContext);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      animationId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!isPlaying || !analyserRef.current) {
        ctx.fillStyle = '#525252';
        ctx.fillRect(0, height / 2 - 1, width, 2);
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        ctx.fillStyle = '#1db954';
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={30} 
      className="rounded bg-neutral-900/40"
    />
  );
}
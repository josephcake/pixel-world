import { useEffect, useRef } from "react";
import {
  makeIllustrationFamilyHouse,
  renderHouse,
} from "../scenes/residential/house/index.js";

const SCALE = 1;

export default function IllustrationHouse({ palette }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const house = makeIllustrationFamilyHouse(palette);
    const fb = renderHouse(house, house.theme);
    const off = document.createElement("canvas");
    off.width = fb.width;
    off.height = fb.height;
    off.getContext("2d").putImageData(
      new ImageData(new Uint8ClampedArray(fb.data), fb.width, fb.height),
      0,
      0,
    );

    const canvas = canvasRef.current;
    canvas.width = fb.width * SCALE;
    canvas.height = fb.height * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      off,
      0,
      0,
      fb.width,
      fb.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", borderRadius: 16 }}
    />
  );
}

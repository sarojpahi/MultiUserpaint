import { useOnDraw } from "@/Components/useonDraw";
import React, { useEffect, useRef, useState } from "react";
const colorArray = ["#1F45FC", "#228B22", "#7E191B", "#E30B5D"];
const DrawingApp = () => {
  const canvasRef = useRef(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [context, setContext] = useState();

  const [color, setColor] = useState(colorArray[0]);
  useEffect(() => {
    if (canvasRef.current) {
      setX(canvasRef.current.clientWidth);
      setY(canvasRef.current.clientHeight);
    }
  }, []);
  const { setCanvasRef, onCanvasMouseDown } = useOnDraw(onDraw);
  function onDraw(ctx, point, prevPoint) {
    drawLine(prevPoint, point, ctx, color);
    setContext(ctx);
  }

  function drawLine(start, end, ctx, color) {
    start = start ?? end;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  const clear = () => {
    context.clearRect(0, 0, x, y);
  };
  return (
    <div className="canvas" ref={canvasRef}>
      <div className="colorPicker">
        {colorArray.map((el, i) => (
          <div
            key={i}
            onClick={() => setColor(el)}
            style={{
              background: el,
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              cursor: "pointer",
            }}
          ></div>
        ))}
        <div className="clear" onClick={() => clear()}>
          Clear
        </div>
      </div>
      <canvas
        width={x}
        height={y}
        ref={setCanvasRef}
        onMouseDown={onCanvasMouseDown}
      />
    </div>
  );
};

export default DrawingApp;

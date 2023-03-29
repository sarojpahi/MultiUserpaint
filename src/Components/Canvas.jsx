import axios from "axios";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const DrawingCanvas = () => {
  const [socket, setSocket] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [connected, setConnected] = useState(false);

  const onDraw = (data) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const { x, y, type, color } = data;
    if (type === "down") {
      context.beginPath();
      context.moveTo(x, y);
      context.strokeStyle = color;
      context.lineWidth = 3;
    } else if (type === "move") {
      context.lineTo(x, y);
      context.stroke();
    } else {
      context.closePath();
    }
  };

  const fetchDrawing = () => {
    axios
      .get(baseUrl)
      .then((res) => res.data.forEach((data) => onDraw(data)))
      .catch((e) => console.log(e));
  };

  useEffect(() => {
    fetchDrawing();
  }, []);
  useEffect(() => {
    const newSocket = io(baseUrl);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to socket.io server");
    });
    socket.on("draw", (data) => {
      onDraw(data);
    });

    socket.on("full", () => {
      console.log("Rooms are full");
    });
    return () => {
      socket.off("connect");
      socket.off("draw");
      socket.off("full");
    };
  }, [socket]);
  const handleMouseDown = (event) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = currentColor;
    context.lineWidth = 3;

    socket.emit("draw", {
      x,
      y,
      type: "down",
      color: currentColor,
    });
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const context = canvas.getContext("2d");
    context.lineTo(x, y);
    context.stroke();
    socket.emit("draw", {
      x,
      y,
      type: "move",
      color: currentColor,
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    socket.emit("draw", {
      type: "up",
    });
  };
  const containerRef = useRef(null);
  const handleColorChange = (event) => {
    setCurrentColor(event.target.value);
  };
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (window) handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleResize() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const devicePixelRatio = window.devicePixelRatio || 1;

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    context.scale(devicePixelRatio, devicePixelRatio);

    setCanvasSize({ width, height });
  }

  return (
    <div>
      <div className="colorPicker">
        <div className="clear">{connected ? "Connected" : "Not Connected"}</div>
        <input
          type="color"
          id="color-picker"
          value={currentColor}
          onChange={handleColorChange}
        />
      </div>

      <div
        className="canvas-container"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="canvas"
        />
      </div>
    </div>
  );
};
export default DrawingCanvas;

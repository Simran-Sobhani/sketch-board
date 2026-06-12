const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Canvas State

let currentColor = "black";
let brushSize = 2;
let currentTool = "stroke";
let isDrawing = false;
let isErasing = false;

let history = [];
let historyIndex = -1;

let startX;
let startY;
let currentPoints = [];

// Canvas Setup

function resizeCanvas() {
  const toolbarHeight = document.querySelector(".tools")?.offsetHeight || 0;

  canvas.width = window.innerWidth - 20;
  canvas.height = window.innerHeight - toolbarHeight - 20;

  redrawCanvas();
}

function resetCanvasBackground() {
  ctx.fillStyle = "white";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Helpers

function getCoordinates(event) {
  const rect = canvas.getBoundingClientRect();

  if (event.touches) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top,
    };
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function applyStyles() {
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (isErasing) {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = currentColor;
  }
}

// Start Drawing

function start(event) {
  event.preventDefault();

  isDrawing = true;

  const { x, y } = getCoordinates(event);

  startX = x;
  startY = y;

  currentPoints = [];

  ctx.beginPath();

  if (currentTool === "stroke") {
    ctx.moveTo(startX, startY);
  }
}

// Draw

function draw(event) {
  if (!isDrawing) return;

  event.preventDefault();

  const { x, y } = getCoordinates(event);

  applyStyles();

  // ===== Pen / Eraser =====
  if (currentTool === "stroke") {
    ctx.lineTo(x, y);
    ctx.stroke();

    currentPoints.push({ x, y });
  }

  // ===== Rectangle =====
  else if (currentTool === "rectangle") {
    redrawCanvas();

    applyStyles();

    drawRectangle(startX, startY, x - startX, y - startY);

    currentPoints = [{ x, y }];
  }

  // ===== Ellipse =====
  else if (currentTool === "ellipse") {
    redrawCanvas();

    applyStyles();

    drawEllipse(startX, startY, x, y);

    currentPoints = [{ x, y }];
  }

  // ===== Line =====
  else if (currentTool === "line") {
    redrawCanvas();

    applyStyles();

    drawLine(startX, startY, x, y);

    currentPoints = [{ x, y }];
  }
}

// Stop Drawing

function stop(event) {
  if (!isDrawing) return;

  event.preventDefault();

  isDrawing = false;

  ctx.beginPath();

  const strokeObject = {
    color: currentColor,
    brushSize,
    operation: isErasing ? "destination-out" : "source-over",

    tool: currentTool,

    startX,
    startY,

    points: [...currentPoints],
  };

  // Remove redo history
  if (historyIndex < history.length - 1) {
    history.splice(historyIndex + 1);
  }

  // Prevent undefined push
  if (startX !== undefined && startY !== undefined) {
    history.push(strokeObject);
    historyIndex++;
  }

  currentPoints = [];
  startX = undefined;
  startY = undefined;
}

// Redraw Canvas

function redrawCanvas() {
  resetCanvasBackground();

  if (historyIndex < 0 || history.length === 0) return;

  ctx.globalCompositeOperation = "source-over";

  for (let i = 0; i <= historyIndex; i++) {
    const item = history[i];

    ctx.lineWidth = item.brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = item.color;
    ctx.globalCompositeOperation = item.operation;

    // ===== Stroke / Eraser =====
    if (item.tool === "stroke") {
      ctx.beginPath();

      ctx.moveTo(item.startX, item.startY);

      for (const point of item.points) {
        ctx.lineTo(point.x, point.y);
      }

      ctx.stroke();
    }

    // ===== Rectangle =====
    else if (item.tool === "rectangle") {
      const endPoint = item.points[0];

      drawRectangle(
        item.startX,
        item.startY,
        endPoint.x - item.startX,
        endPoint.y - item.startY,
      );
    }

    // ===== Ellipse =====
    else if (item.tool === "ellipse") {
      const endPoint = item.points[0];

      drawEllipse(item.startX, item.startY, endPoint.x, endPoint.y);
    }

    // ===== Line =====
    else if (item.tool === "line") {
      const endPoint = item.points[0];

      drawLine(item.startX, item.startY, endPoint.x, endPoint.y);
    }
  }

  ctx.globalCompositeOperation = "source-over";
}

// Shape Drawing

function drawRectangle(x, y, width, height) {
  ctx.strokeRect(x, y, width, height);
}

function drawEllipse(startX, startY, endX, endY) {
  ctx.beginPath();

  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;

  const radiusX = Math.abs(endX - startX) / 2;

  const radiusY = Math.abs(endY - startY) / 2;

  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

  ctx.stroke();
}

function drawLine(startX, startY, endX, endY) {
  ctx.beginPath();

  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);

  ctx.stroke();
}

// Canvas Controls

function clearCanvas() {
  resetCanvasBackground();

  history = [];
  historyIndex = -1;

  ctx.globalCompositeOperation = "source-over";
}

function undoOperation() {
  if (historyIndex >= 0) {
    historyIndex--;
    redrawCanvas();
  }
}

function redoOperation() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    redrawCanvas();
  }
}

// Event Listeners

canvas.addEventListener("mousedown", start);

canvas.addEventListener("mousemove", draw);

canvas.addEventListener("mouseup", stop);

canvas.addEventListener("mouseout", stop);

canvas.addEventListener("touchstart", start, false);

canvas.addEventListener("touchmove", draw, false);

canvas.addEventListener("touchend", stop, false);

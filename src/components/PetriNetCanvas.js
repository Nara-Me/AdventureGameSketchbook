import React, { useRef, useState, useEffect } from 'react';

const PetriNetCanvas = ({ currentTool }) => {
    const canvasRef = useRef(null);
    const [elements, setElements] = useState([]);
    const [isDrawingArc, setIsDrawingArc] = useState(false);
    const [arcStart, setArcStart] = useState(null);  // Store the element to start an arc
  
    const draw = (ctx) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      elements.forEach((element) => element.draw(ctx));
    };
  
    useEffect(() => {
      const ctx = canvasRef.current.getContext('2d');
      draw(ctx);
    }, [elements]);
  
    const addElement = (x, y) => {
      const newElement = createElement(x, y);
      setElements((prev) => [...prev, newElement]);
    };

  const createElement = (x, y) => {
    if (currentTool === 'place') {
      return new Place(x, y);
    } else if (currentTool === 'transition') {
      return new Transition(x, y);
    } else if (currentTool === 'arc') {
      return createArc(x, y);
    }
    return null;
  };

  const createArc = (x, y) => {
    if (isDrawingArc && arcStart) {
      const endElement = getElementAt(x, y);
      if (endElement) {
        setIsDrawingArc(false);
        return new Arc(arcStart, endElement);
      }
    } else if (!isDrawingArc){
      const startElement = getElementAt(x, y);
      if (startElement) {
        setArcStart(startElement);
        setIsDrawingArc(true);
      }
    }
    return null;
  };

  const getElementAt = (x, y) => {
    return elements.find((el) => el.contains(x, y));
  };

  const handleClick = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    if (currentTool === 'arc') {
        addElement(x, y);  // Only add an element if necessary (in the case of an arc)
      } else {
        addElement(x, y);  // Add places or transitions
      }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleClick}
        style={{ border: '1px solid #000', background: '#d9d9d9' }}
      />
    </div>
  );
};

// Basic Place Class
class Place {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
  }

  contains(x, y) {
    return Math.hypot(this.x - x, this.y - y) < this.radius;
  }
}

// Basic Transition Class
class Transition {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 40;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.stroke();
  }

  contains(x, y) {
    return (
      x > this.x - this.width / 2 &&
      x < this.x + this.width / 2 &&
      y > this.y - this.height / 2 &&
      y < this.y + this.height / 2
    );
  }
}

// Arc Class
class Arc {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
  }
}

export default PetriNetCanvas;
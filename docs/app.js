document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sketchpad');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let currentBrush = 'fountain';
    let currentColor = '#242220';
    let currentSize = 4;
    
    const undoStack = [];
    const redoStack = [];
    
    function saveState() {
        if (undoStack.length > 20) undoStack.shift();
        undoStack.push(canvas.toDataURL());
    }
    
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        saveState();
        ctx.beginPath();
        const r = canvas.getBoundingClientRect();
        ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        
        ctx.lineTo(x, y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentSize;
        ctx.stroke();
    });
    
    canvas.addEventListener('mouseup', () => isDrawing = false);
    
    document.getElementById('btn-undo').addEventListener('click', () => {
        if (undoStack.length === 0) return;
        redoStack.push(canvas.toDataURL());
        const img = new Image();
        img.src = undoStack.pop();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    });
});

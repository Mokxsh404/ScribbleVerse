
document.addEventListener('DOMContentLoaded', () => {
    // If hosting the HTML/JS frontend on GitHub Pages/Vercel/Netlify and the Python backend on a cloud service,
    // paste your hosted Flask backend URL here (e.g., "https://your-app.onrender.com").
    // Keep it as "" if hosting both on the same server (relative requests).
    const BACKEND_URL = "";
    let isDrawing = false; // drawing state
    let currentBrush = 'fountain';
    let currentSize = 4;
    let currentColor = '#242220';
    let soundEnabled = true; // typewriter sound toggle
    let isTyping = false;
    let typingTimeout = null;
    
    // undo/redo
    const undoStack = [];
    const redoStack = [];
    const maxHistory = 20;

    // stroke tracking
    let strokeCount = 0;
    let totalPoints = 0;
    let drawingStartTime = null;
    let lastPointTime = null;
    let strokeSpeeds = [];
    let strokeCoordinates = [];
    let colorCounts = {
        '#242220': 0,
        '#4F3B2F': 0,
        '#1D2E45': 0,
        '#A64B2A': 0,
        '#3F5E4D': 0
    };
    const canvas = document.getElementById('sketchpad');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const brushSizeSlider = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-val');
    const brushButtons = document.querySelectorAll('#brush-selector .btn-tool');
    const inkWells = document.querySelectorAll('.ink-wells .ink-well');
    
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnClear = document.getElementById('btn-clear');
    const btnGenerate = document.getElementById('btn-generate');
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const btnApiSettings = document.getElementById('btn-api-settings');
    
    const poetryLoader = document.getElementById('poetry-loader');
    const poetryDisplayArea = document.getElementById('poetry-display-area');
    const typedPoemContainer = document.getElementById('typed-poem-container');
    const typedTitle = document.getElementById('typed-title');
    const typedBody = document.getElementById('typed-body');
    const poemSignature = document.getElementById('poem-signature');
    const poetryActions = document.getElementById('poetry-actions');
    
    const btnCopyText = document.getElementById('btn-copy-text');
    const btnSaveArchive = document.getElementById('btn-save-archive');
    const btnExportCard = document.getElementById('btn-export-card');
    const btnSpeakPoem = document.getElementById('btn-speak-poem');
    const speakBtnText = document.getElementById('speak-btn-text');
    
    
    const btnUploadImage = document.getElementById('btn-upload-image');
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadOverlay = document.getElementById('upload-overlay');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    
    const btnGalleryToggle = document.getElementById('btn-gallery-toggle');
    const galleryContent = document.getElementById('gallery-content');
    const galleryToggleIcon = document.getElementById('gallery-toggle-icon');
    const galleryGrid = document.getElementById('gallery-grid');
    const archiveCountLabel = document.getElementById('archive-count');
    
    
    const apiModal = document.getElementById('api-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const geminiKeyInput = document.getElementById('gemini-key-input');
    const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
    const btnSaveKey = document.getElementById('btn-save-key');
    const btnClearKey = document.getElementById('btn-clear-key');
    const keyStatusBox = document.getElementById('key-status-box');

    
    const drawingStatsLabel = document.getElementById('drawing-stats');

    // current poem data
    let activePoem = {
        title: "",
        body: "",
        meta: ""
    };
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTypewriterSound(type) {
        if (!soundEnabled) return;
        try {
            initAudio();
            const now = audioCtx.currentTime;

            if (type === 'clack') {
                
                
                const bufferSize = audioCtx.sampleRate * 0.025;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                const noiseFilter = audioCtx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                
                noiseFilter.frequency.setValueAtTime(1600 + Math.random() * 500, now);
                noiseFilter.Q.value = 6;

                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.06, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);

                
                const osc = audioCtx.createOscillator();
                const oscGain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240 + Math.random() * 80, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.012);

                oscGain.gain.setValueAtTime(0.09, now);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

                osc.connect(oscGain);
                oscGain.connect(audioCtx.destination);

                noise.start(now);
                osc.start(now);
                osc.stop(now + 0.025);

            } else if (type === 'space') {
                
                const osc = audioCtx.createOscillator();
                const oscGain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(110, now);
                osc.frequency.linearRampToValueAtTime(45, now + 0.04);

                oscGain.gain.setValueAtTime(0.18, now);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

                const bufferSize = audioCtx.sampleRate * 0.04;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                const noiseFilter = audioCtx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.value = 450;

                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.04, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);

                osc.connect(oscGain);
                oscGain.connect(audioCtx.destination);

                osc.start(now);
                noise.start(now);
                osc.stop(now + 0.05);

            } else if (type === 'return') {
                
                const duration = 0.4;
                const bufferSize = audioCtx.sampleRate * duration;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    
                    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;

                const noiseFilter = audioCtx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(900, now);
                noiseFilter.frequency.linearRampToValueAtTime(500, now + duration - 0.05);
                noiseFilter.Q.value = 5;

                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.015, now);
                noiseGain.gain.linearRampToValueAtTime(0.02, now + 0.08);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);

                
                const bell = audioCtx.createOscillator();
                const bellGain = audioCtx.createGain();
                bell.type = 'sine';
                bell.frequency.setValueAtTime(1950, now);

                bellGain.gain.setValueAtTime(0.06, now);
                bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                bell.connect(bellGain);
                bellGain.connect(audioCtx.destination);

                noise.start(now);
                bell.start(now);
                bell.stop(now + duration);
            }
        } catch (e) {
            console.warn('Web Audio Playback failed:', e);
        }
    }
    
    
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (canvas.width > 0 && canvas.height > 0) {
            tempCtx.drawImage(canvas, 0, 0);
        }
        
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        
        
        if (undoStack.length === 0) {
            saveState();
        }
    }
    
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    
    function saveState() {
        const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        
        if (undoStack.length >= maxHistory) {
            undoStack.shift();
        }
        undoStack.push(state);
        redoStack.length = 0;
        
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        
        btnUndo.disabled = undoStack.length <= 1;
        btnRedo.disabled = redoStack.length === 0;
    }

    
    let lastX = 0;
    let lastY = 0;
    let fountainLastWidth = currentSize;

    // Start drawing
    function startDrawing(e) {
        
        if (soundEnabled) initAudio();
        
        isDrawing = true;
        
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        lastX = e.offsetX;
        lastY = e.offsetY;
        
        if (drawingStartTime === null) {
            drawingStartTime = Date.now();
        }
        lastPointTime = Date.now();
        strokeCount++;
        
        
        strokeCoordinates.push({ x: lastX, y: lastY });
        
        
        if (colorCounts[currentColor] !== undefined) {
            colorCounts[currentColor]++;
        }
        
        
        fountainLastWidth = currentSize;
        
        
        draw(e);
    }

    // Draw stroke
    function draw(e) {
        if (!isDrawing) return;

        const x = e.offsetX;
        const y = e.offsetY;
        const now = Date.now();
        const timeDiff = now - lastPointTime;
        
        
        totalPoints++;
        strokeCoordinates.push({ x: x, y: y });
        
        
        const dist = Math.hypot(x - lastX, y - lastY);
        let speed = 0;
        if (timeDiff > 0 && dist > 0) {
            speed = dist / timeDiff;
            strokeSpeeds.push(speed);
        }
        
        lastPointTime = now;

        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
        
        if (currentBrush === 'fountain') {
            // pressure simulation
            ctx.globalCompositeOperation = 'source-over';
            
            
            const maxSpeedLimit = 8;
            const targetWidth = Math.max(1.2, currentSize * (1 - Math.min(speed, maxSpeedLimit) / (maxSpeedLimit * 1.5)));
            
            fountainLastWidth = fountainLastWidth * 0.75 + targetWidth * 0.25;
            
            ctx.lineWidth = fountainLastWidth;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            
        } else if (currentBrush === 'calligraphy') {
            // Calligraphy: angled ribbon (constant 45 degrees, thick on diagonal sweeps, thin on counter)
            ctx.globalCompositeOperation = 'source-over';
            
            const ribbonWidth = currentSize * 2.2;
            const angle = Math.PI / 4; // 45 degrees angle
            const dx = Math.cos(angle) * (ribbonWidth / 2);
            const dy = Math.sin(angle) * (ribbonWidth / 2);
            
            // Draw a calligraphic quadrilateral polygon connecting ribbon edges
            ctx.beginPath();
            ctx.moveTo(lastX - dx, lastY - dy);
            ctx.lineTo(x - dx, y - dy);
            ctx.lineTo(x + dx, y + dy);
            ctx.lineTo(lastX + dx, lastY + dy);
            ctx.closePath();
            ctx.fill();
            
        } else if (currentBrush === 'charcoal') {
            // Charcoal: texturized granular spray of carbon specs
            ctx.globalCompositeOperation = 'source-over';
            
            // Interpolate coordinates if movements are fast to avoid gapping
            const steps = Math.max(1, Math.floor(dist / 2));
            const opacityHex = Math.floor(0.12 * 255).toString(16).padStart(2, '0');
            ctx.fillStyle = currentColor + opacityHex; // Hex opacity for translucent specs
            
            for (let s = 0; s < steps; s++) {
                const px = lastX + (x - lastX) * (s / steps);
                const py = lastY + (y - lastY) * (s / steps);
                
                // Splatter a cluster of random specs based on brush size
                const density = Math.max(8, currentSize * 3);
                const scatterRadius = currentSize * 2.5;
                
                for (let i = 0; i < density; i++) {
                    // Random Gaussian-like box distribution
                    const rx = px + (Math.random() - 0.5) * scatterRadius * 2;
                    const ry = py + (Math.random() - 0.5) * scatterRadius * 2;
                    const dotRadius = Math.random() * 0.8 + 0.2;
                    
                    ctx.beginPath();
                    ctx.arc(rx, ry, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
        } else if (currentBrush === 'eraser') {
            // Art Eraser: removes ink showing textured background beneath
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = currentSize * 2.5;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        lastX = x;
        lastY = y;
        
        // Update stats summary label
        updateDrawingStatusLabel();
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        saveState();
    }

    // Update the visual metrics summary
    function updateDrawingStatusLabel() {
        if (strokeCount === 0) {
            drawingStatsLabel.textContent = "Blank Paper";
            return;
        }
        
        const count = strokeCount;
        let style = "Minimalist";
        if (count > 28) style = "Intricate";
        else if (count > 12) style = "Structured";
        
        let colorName = "Carbon Ink";
        if (currentColor === '#4F3B2F') colorName = "Walnut Sepia";
        else if (currentColor === '#1D2E45') colorName = "Indigo Wash";
        else if (currentColor === '#A64B2A') colorName = "Terracotta";
        else if (currentColor === '#3F5E4D') colorName = "Sage Green";
        
        drawingStatsLabel.textContent = `${style} sketch in ${colorName} (${count} lines)`;
    }

    // --- Toolbar Event Listeners ---
    
    // Brush Types
    brushButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            brushButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBrush = btn.dataset.brush;
        });
    });

    // Brush Size Slider
    brushSizeSlider.addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value);
        brushSizeVal.textContent = `${currentSize}px`;
    });

    // Color Swatches
    inkWells.forEach(well => {
        well.addEventListener('click', () => {
            inkWells.forEach(w => w.classList.remove('active'));
            well.classList.add('active');
            currentColor = well.dataset.color;
        });
    });

    // Undo Action
    btnUndo.addEventListener('click', () => {
        if (undoStack.length <= 1) return;
        
        const currentState = undoStack.pop();
        redoStack.push(currentState);
        
        const previousState = undoStack[undoStack.length - 1];
        ctx.putImageData(previousState, 0, 0);
        
        strokeCount = Math.max(0, strokeCount - 1);
        updateDrawingStatusLabel();
        updateHistoryButtons();
    });

    // Redo Action
    btnRedo.addEventListener('click', () => {
        if (redoStack.length === 0) return;
        
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        
        ctx.putImageData(nextState, 0, 0);
        
        strokeCount++;
        updateDrawingStatusLabel();
        updateHistoryButtons();
    });

    // Clear Canvas
    btnClear.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset drawing tracking metrics
        strokeCount = 0;
        totalPoints = 0;
        drawingStartTime = null;
        lastPointTime = null;
        strokeSpeeds.length = 0;
        strokeCoordinates.length = 0;
        Object.keys(colorCounts).forEach(k => colorCounts[k] = 0);
        
        saveState();
        updateDrawingStatusLabel();
        canvasWrapper.classList.remove('has-image');
    });

    // --- Image Upload Functionality ---
    
    // Click upload button â†’ trigger file input
    btnUploadImage.addEventListener('click', () => {
        imageUploadInput.click();
    });

    // Handle file selection
    imageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadImageToCanvas(file);
        // Reset input so same file can be re-selected
        imageUploadInput.value = '';
    });

    // Drag-and-drop support on canvas
    canvasWrapper.addEventListener('dragenter', (e) => {
        e.preventDefault();
        uploadOverlay.classList.remove('hidden');
    });

    canvasWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    canvasWrapper.addEventListener('dragleave', (e) => {
        // Only hide if we leave the wrapper entirely
        if (!canvasWrapper.contains(e.relatedTarget)) {
            uploadOverlay.classList.add('hidden');
        }
    });

    canvasWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadOverlay.classList.add('hidden');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImageToCanvas(file);
        }
    });

    function loadImageToCanvas(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Clear canvas first
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate fit dimensions (contain within canvas)
                const dpr = window.devicePixelRatio || 1;
                const canvasW = canvas.width / dpr;
                const canvasH = canvas.height / dpr;
                
                const imgAspect = img.width / img.height;
                const canvasAspect = canvasW / canvasH;
                
                let drawW, drawH, drawX, drawY;
                if (imgAspect > canvasAspect) {
                    // Image is wider â€” fit to width
                    drawW = canvasW;
                    drawH = canvasW / imgAspect;
                    drawX = 0;
                    drawY = (canvasH - drawH) / 2;
                } else {
                    // Image is taller â€” fit to height
                    drawH = canvasH;
                    drawW = canvasH * imgAspect;
                    drawX = (canvasW - drawW) / 2;
                    drawY = 0;
                }
                
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
                
                // Update state
                strokeCount = 1; // Mark as non-empty
                saveState();
                drawingStatsLabel.textContent = "Uploaded image loaded";
                canvasWrapper.classList.add('has-image');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Attach Pointer events for drawing
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
    canvas.addEventListener('pointerleave', stopDrawing);

    // Audio ON/OFF switch
    btnAudioToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            btnAudioToggle.classList.add('active');
            btnAudioToggle.querySelector('.audio-text').textContent = "Sound ON";
            btnAudioToggle.querySelector('i').className = "fa-solid fa-volume-high";
            initAudio();
        } else {
            btnAudioToggle.classList.remove('active');
            btnAudioToggle.querySelector('.audio-text').textContent = "Muted";
            btnAudioToggle.querySelector('i').className = "fa-solid fa-volume-xmark";
        }
    });

    // --- Dual Poetry Generation Engine ---

    // 1. Procedural Poetry Compiler (Local Ink Intelligence)
    const localPoetryVocabulary = {
        gothic: {
            nouns: ["shadow", "void", "bone", "crypt", "feather", "eclipse", "ash", "wound", "shroud", "echo", "night", "winter", "abyss"],
            verbs: ["fades", "haunts", "breaks", "dissolves", "sighs", "lingers", "weeps", "shivers", "forgets", "sinks", "breathes"],
            adjectives: ["dark", "hollow", "heavy", "stark", "silent", "cold", "ash-gray", "lost", "somber", "raw", "ancient"]
        },
        nostalgia: {
            nouns: ["memory", "amber", "parchment", "hearth", "thread", "clock", "letter", "dust", "portrait", "attic", "sunset", "echo"],
            verbs: ["remembers", "warms", "slows", "holds", "fades", "weaves", "glows", "returns", "sighs", "lingers", "keeps"],
            adjectives: ["golden", "sepia", "soft", "faded", "antique", "warm", "vintage", "quiet", "long-forgotten", "slow", "fragile"]
        },
        dream: {
            nouns: ["dream", "tide", "star", "indigo", "wave", "ocean", "mirror", "mist", "horizon", "slumber", "beacon", "current"],
            verbs: ["floats", "ebbs", "shines", "drowns", "wanders", "reflects", "veils", "beckons", "sleeps", "dissolves", "drifts"],
            adjectives: ["deep", "indigo", "limitless", "faint", "dreamlike", "cool", "shadowy", "silent", "starry", "fluid", "vague"]
        },
        vitality: {
            nouns: ["fire", "pulse", "blood", "spark", "ember", "forge", "flesh", "clay", "sun", "heart", "storm", "strike", "fury"],
            verbs: ["burns", "strikes", "dances", "pulses", "leaps", "carves", "forges", "screams", "tears", "creates", "ignites"],
            adjectives: ["scarlet", "raw", "wild", "intense", "sharp", "fierce", "burning", "heavy", "eager", "crimson", "restless"]
        },
        nature: {
            nouns: ["root", "branch", "leaf", "moss", "stone", "river", "wind", "meadow", "sky", "bloom", "forest", "rain", "dew"],
            verbs: ["grows", "breathes", "whispers", "drifts", "clings", "unfolds", "sleeps", "rises", "flows", "heals", "settles"],
            adjectives: ["green", "silent", "ancient", "soft", "mossy", "tranquil", "wild", "tender", "slow", "earthbound", "sage"]
        }
    };

    function compileProceduralPoem() {
        // Calculate Bounding Box coordinates
        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
        if (strokeCoordinates.length > 0) {
            strokeCoordinates.forEach(pt => {
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            });
        } else {
            minX = 0; maxX = canvas.width; minY = 0; maxY = canvas.height;
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const aspect = width / (height || 1); // aspect ratio
        
        // 1. Classify Aspect Ratio
        let layoutProfile = "square";
        if (aspect > 1.35) layoutProfile = "horizontal";
        else if (aspect < 0.75) layoutProfile = "vertical";

        // 2. Classify Color (Primary ink used)
        let mainInk = currentColor;
        let maxCount = -1;
        Object.entries(colorCounts).forEach(([col, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mainInk = col;
            }
        });

        let currentMood = 'gothic';
        let inkLabel = "Carbon";
        if (mainInk === '#242220') { currentMood = 'gothic'; inkLabel = "Carbon Black"; }
        else if (mainInk === '#4F3B2F') { currentMood = 'nostalgia'; inkLabel = "Walnut Sepia"; }
        else if (mainInk === '#1D2E45') { currentMood = 'dream'; inkLabel = "Indigo Wash"; }
        else if (mainInk === '#A64B2A') { currentMood = 'vitality'; inkLabel = "Terracotta"; }
        else if (mainInk === '#3F5E4D') { currentMood = 'nature'; inkLabel = "Sage Green"; }

        // 3. Classify Speed
        let avgSpeed = 0;
        if (strokeSpeeds.length > 0) {
            avgSpeed = strokeSpeeds.reduce((a, b) => a + b, 0) / strokeSpeeds.length;
        }
        let speedProfile = "moderate";
        if (avgSpeed > 3.0) speedProfile = "fast";
        else if (avgSpeed < 1.0) speedProfile = "slow";

        // 4. Classify Density (Total drawing coverage)
        let densityProfile = "balanced";
        const totalMovement = totalPoints;
        if (strokeCount > 0) {
            if (totalMovement < 35 && strokeCount < 6) densityProfile = "minimal";
            else if (totalMovement > 250 || strokeCount > 25) densityProfile = "dense";
        }

        // Vocabulary helpers
        const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const n = (mood) => getRand(localPoetryVocabulary[mood].nouns);
        const v = (mood) => getRand(localPoetryVocabulary[mood].verbs);
        const a = (mood) => getRand(localPoetryVocabulary[mood].adjectives);

        // Select secondary dictionary to add contrast
        const secondaryMood = densityProfile === 'dense' ? 'vitality' : 
                              speedProfile === 'slow' ? 'nostalgia' : 
                              speedProfile === 'fast' ? 'gothic' : 'nature';

        // Title Compiler
        const titleWords = [
            `THE ${a(currentMood).toUpperCase()} ${n(secondaryMood).toUpperCase()}`,
            `STUDY IN ${a(currentMood).toUpperCase()} LINES`,
            `THE ${n(currentMood).toUpperCase()} OF ${a(secondaryMood).toUpperCase()} SILENCE`,
            `WHISPERS IN ${inkLabel.toUpperCase()}`
        ];
        const title = getRand(titleWords);

        // Stanza 1 Builder (Layout/Outline focus)
        let stanza1 = "";
        if (layoutProfile === 'vertical') {
            stanza1 = `A vertical outline, thin and high,\n` +
                      `climbs like a ${a(currentMood)} ${n(secondaryMood)} to the sky.\n` +
                      `Each stroke a bone, a rising thread,\n` +
                      `where ink and parchment slowly wed.`;
        } else if (layoutProfile === 'horizontal') {
            stanza1 = `Across the page, the lines expand,\n` +
                      `like horizons in a ${a(secondaryMood)} land.\n` +
                      `The hand has laid a quiet ${n(currentMood)},\n` +
                      `where waters drift and shadows meet.`;
        } else {
            stanza1 = `A central focus, small and deep,\n` +
                      `a ${a(currentMood)} secret the fibers keep.\n` +
                      `The inkwell bleeds, the strokes align,\n` +
                      `to shape a loop of dark design.`;
        }

        // Stanza 2 Builder (Speed/Tempo focus)
        let stanza2 = "";
        if (speedProfile === 'fast') {
            stanza2 = `In hurried sweeps of sudden force,\n` +
                      `the metal nib has run its course.\n` +
                      `It ${v(currentMood)} quick, a nervous spark,\n` +
                      `that tears a pathway through the dark.`;
        } else if (speedProfile === 'slow') {
            stanza2 = `With quiet pause and steady weight,\n` +
                      `the charcoal writes its heavy fate.\n` +
                      `It slowly breathes, it lingers long,\n` +
                      `to hum a faint, forgotten song.`;
        } else {
            stanza2 = `A balanced tempo guides the hand\n` +
                      `to chart this newly drafted land.\n` +
                      `No rush to strike, no fear of slip,\n` +
                      `just liquid thought from pen to tip.`;
        }

        // Stanza 3 Builder (Density/Resolution focus)
        let stanza3 = "";
        if (densityProfile === 'dense') {
            stanza3 = `A tangled maze of layered shade,\n` +
                      `a fortress that the ink has made.\n` +
                      `The crowded page is dark and deep,\n` +
                      `where ${a(currentMood)} ${n(currentMood)}s go to sleep.`;
        } else if (densityProfile === 'minimal') {
            stanza3 = `A single trace, a lonely mark,\n` +
                      `a tiny whisper in the dark.\n` +
                      `It leaves the paper clean and wide,\n` +
                      `with only silence at its side.`;
        } else {
            stanza3 = `The balance settles in the sheet,\n` +
                      `where dark and empty spaces meet.\n` +
                      `A visual pulse, a structured dream,\n` +
                      `sealed in a wash of gold and cream.`;
        }

        // Dynamic footer signature
        const speedText = speedProfile === 'fast' ? 'tempestuous' : (speedProfile === 'slow' ? 'deliberate' : 'steady');
        const densityText = densityProfile === 'dense' ? 'complex' : (densityProfile === 'minimal' ? 'zen-like' : 'balanced');
        
        return {
            title: title,
            body: `${stanza1}\n\n${stanza2}\n\n${stanza3}`,
            meta: `Local Ink Analysis: A ${speedText} and ${densityText} composition of ${strokeCount} strokes drawn with ${inkLabel}.`
        };
    }

    // 2. Hack Club AI Vision Caller (GPT-4o via Flask proxy)
    async function generateAIPoem() {
        // Convert canvas drawing to base64 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64Data = dataUrl.split(',')[1];
        
        const payload = {
            model: "openai/gpt-4o",
            max_tokens: 1200,
            messages: [
                {
                    role: "system",
                    content: "You are ScribbleVerse â€” a deeply perceptive, literary poet who transforms visual art into vivid, emotionally resonant poetry. " +
                             "You have the eye of a gallery critic and the soul of a romantic poet. " +
                             "You never write generic poems. Every poem you create is intimately tied to the SPECIFIC visual details you observe: " +
                             "the exact colors, shapes, objects, text, figures, textures, composition, and emotional atmosphere of the artwork. " +
                             "Your poems are rich with concrete imagery, metaphor, and sensory language. " +
                             "You write in a style that blends classic literary craft with raw emotional honesty."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Study the attached image very carefully. Follow these steps:\n\n" +
                                  "1. VISUAL ANALYSIS: Look closely at EVERY detail â€” identify all objects, figures, text/words, colors (name exact shades), shapes, patterns, textures, spatial composition (what's in foreground vs background), and the overall mood/atmosphere.\n\n" +
                                  "2. DEFINITION: Write a vivid 2-3 sentence poetic description of what you see. Be SPECIFIC â€” name the actual objects, colors, and elements. Don't be vague.\n\n" +
                                  "3. POEM: Write a rich, emotionally deep poem of 3-4 stanzas (4-6 lines each) that is DIRECTLY inspired by the specific visual content. " +
                                  "The poem MUST reference concrete details from the image (specific colors you see, shapes, objects, any text/words visible, the mood conveyed). " +
                                  "Use vivid sensory language â€” sight, touch, sound, smell. Use metaphor and symbolism grounded in what you actually see. " +
                                  "Do NOT write a generic poem that could apply to any image. Every line should feel like it could ONLY have been written about THIS specific image.\n\n" +
                                  "Format your response EXACTLY like this:\n" +
                                  "TITLE: [a evocative, specific title rooted in what you see]\n" +
                                  "DEFINITION: [your 2-3 sentence vivid visual description]\n" +
                                  "POEM:\n" +
                                  "[stanza 1]\n\n" +
                                  "[stanza 2]\n\n" +
                                  "[stanza 3]\n\n" +
                                  "[stanza 4 â€” optional but encouraged]"
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Data}`
                            }
                        }
                    ]
                }
            ]
        };

        const customKey = localStorage.getItem('scribbleverse_gemini_key');
        const hasCustomKey = customKey && customKey !== 'local' && customKey.trim().length > 0;
        
        const requestBody = { payload };
        if (hasCustomKey) {
            requestBody.custom_api_key = customKey.trim();
        }

        
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API request failed (${response.status})`);
        }

        const result = await response.json();
        const fullText = result.choices?.[0]?.message?.content;
        
        if (!fullText) {
            throw new Error("No poetry generated in response.");
        }

        
        const lines = fullText.trim().split('\n');
        let title = "";
        let definition = "";
        let bodyLines = [];
        let readingPoem = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const upperLine = line.toUpperCase();
            if (upperLine.startsWith("TITLE:")) {
                title = line.substring(6).trim();
            } else if (upperLine.startsWith("DEFINITION:")) {
                definition = line.substring(11).trim();
            } else if (upperLine.startsWith("POEM:")) {
                readingPoem = true;
            } else {
                if (readingPoem) {
                    bodyLines.push(lines[i]);
                } else {
                    if (line) {
                        if (!title) {
                            title = line.replace(/[#*]/g, '').trim();
                        } else if (!definition) {
                            definition = line.trim();
                        } else {
                            bodyLines.push(lines[i]);
                        }
                    } else if (title || definition) {
                        bodyLines.push(lines[i]);
                    }
                }
            }
        }

        title = title || "UNTITLED CHORD";
        definition = definition || "An abstract configuration of lines.";
        let bodyText = bodyLines.join('\n').trim();
        if (!bodyText) {
            bodyText = fullText;
        }

        return {
            title: title.toUpperCase(),
            body: bodyText,
            meta: `Composed by AI Vision (GPT-4o). Definition: ${definition}`
        };
    }

    // --- Typewriter Ink Animation Display ---
    
    function startPrintingPoem(poem) {
        
        if (typingTimeout) clearTimeout(typingTimeout);
        isTyping = true;
        
        
        activePoem = poem;
        
        
        poetryDisplayArea.classList.add('hidden');
        typedPoemContainer.classList.remove('hidden');
        poetryActions.style.display = 'none';
        
        typedTitle.innerHTML = "";
        typedBody.innerHTML = "";
        poemSignature.innerHTML = "";
        
        
        const titleChars = poem.title.split('');
        const bodyText = poem.body;
        
        
        let titleIndex = 0;
        
        function printTitle() {
            if (!isTyping) return;
            
            if (titleIndex < titleChars.length) {
                const char = titleChars[titleIndex];
                const span = document.createElement('span');
                span.className = 'ink-char';
                span.textContent = char;
                typedTitle.appendChild(span);
                
                
                if (char === ' ') {
                    playTypewriterSound('space');
                } else {
                    playTypewriterSound('clack');
                }
                
                titleIndex++;
                
                const delay = 40 + Math.random() * 40;
                typingTimeout = setTimeout(printTitle, delay);
            } else {
                
                playTypewriterSound('return');
                typingTimeout = setTimeout(() => {
                    printBody(0);
                }, 800);
            }
        }

        
        const bodyChars = bodyText.split('');
        
        function printBody(index) {
            if (!isTyping) return;
            
            if (index < bodyChars.length) {
                const char = bodyChars[index];
                
                
                if (char === '\n') {
                    
                    const isDouble = bodyChars[index + 1] === '\n';
                    const br = document.createElement('br');
                    typedBody.appendChild(br);
                    
                    playTypewriterSound('return');
                    
                    const skip = isDouble ? 2 : 1;
                    
                    typingTimeout = setTimeout(() => {
                        printBody(index + skip);
                    }, 450);
                    return;
                }
                
                const span = document.createElement('span');
                span.className = 'ink-char';
                span.textContent = char;
                typedBody.appendChild(span);
                
                
                if (char === ' ') {
                    playTypewriterSound('space');
                } else {
                    playTypewriterSound('clack');
                }
                
                
                let delay = 50 + Math.random() * 45;
                
                
                if ([',', '.', ';', ':', '?', '!'].includes(char)) {
                    delay = 450 + Math.random() * 150;
                }
                
                if (index > 0 && bodyChars[index - 1] === char) {
                    delay = 25 + Math.random() * 20;
                }
                
                typingTimeout = setTimeout(() => {
                    printBody(index + 1);
                }, delay);
            } else {
                
                playTypewriterSound('return');
                setTimeout(() => {
                    
                    poemSignature.innerHTML = `<span class="ink-char">${poem.meta}</span>`;
                    isTyping = false;
                    
                    poetryActions.style.display = 'flex';
                }, 600);
            }
        }
        
        
        printTitle();
    }
    btnGenerate.addEventListener('click', async () => {
        if (strokeCount === 0) {
            alert("Please sketch something on the paper first.");
            return;
        }
        
        if (isTyping) {
            
            isTyping = false;
            if (typingTimeout) clearTimeout(typingTimeout);
        }

        
        poetryLoader.classList.remove('hidden');
        poetryDisplayArea.classList.add('hidden');
        typedPoemContainer.classList.add('hidden');
        poetryActions.style.display = 'none';

        setTimeout(async () => {
            try {
                const poem = await generateAIPoem();
                poetryLoader.classList.add('hidden');
                startPrintingPoem(poem);
            } catch (err) {
                console.error(err);
                poetryLoader.classList.add('hidden');
                alert(`AI Generation Failed: ${err.message}\n\nFalling back to Local Ink Intelligence.`);
                
                
                const localPoem = compileProceduralPoem();
                startPrintingPoem(localPoem);
            }
        }, 1200);
    });
    
    
    btnApiSettings.addEventListener('click', () => {
        apiModal.classList.remove('hidden');
        loadKeyConfigState();
    });

    btnCloseModal.addEventListener('click', () => {
        apiModal.classList.add('hidden');
    });

    
    apiModal.addEventListener('click', (e) => {
        if (e.target === apiModal) {
            apiModal.classList.add('hidden');
        }
    });

    btnToggleKeyVisibility.addEventListener('click', () => {
        const type = geminiKeyInput.type === 'password' ? 'text' : 'password';
        geminiKeyInput.type = type;
        const icon = btnToggleKeyVisibility.querySelector('i');
        icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });

    function loadKeyConfigState() {
        const dot = keyStatusBox.querySelector('.status-dot');
        const text = keyStatusBox.querySelector('.status-text');
        
        const storedKey = localStorage.getItem('scribbleverse_gemini_key');
        if (storedKey && storedKey !== 'local' && storedKey.trim().length > 0) {
            dot.className = "status-dot green";
            text.textContent = "Using custom API key";
            geminiKeyInput.value = storedKey;
        } else {
            dot.className = "status-dot green";
            text.textContent = "Using default API key";
            geminiKeyInput.value = "";
        }
    }

    btnSaveKey.addEventListener('click', () => {
        const val = geminiKeyInput.value.trim();
        if (val) {
            localStorage.setItem('scribbleverse_gemini_key', val);
            alert("API Configuration Saved.");
        } else {
            localStorage.setItem('scribbleverse_gemini_key', 'local');
            alert("API Key cleared. Using default key.");
        }
        loadKeyConfigState();
        apiModal.classList.add('hidden');
    });

    btnClearKey.addEventListener('click', () => {
        localStorage.setItem('scribbleverse_gemini_key', 'local');
        geminiKeyInput.value = "";
        loadKeyConfigState();
        alert("Custom API Configuration Removed. Defaulting to server key.");
        apiModal.classList.add('hidden');
    });
    
    
    btnGalleryToggle.addEventListener('click', () => {
        const isCollapsed = galleryContent.classList.contains('collapsed');
        if (isCollapsed) {
            galleryContent.classList.remove('collapsed');
            galleryContent.classList.add('expanded');
            galleryToggleIcon.classList.add('rotated');
            loadGalleryCards();
        } else {
            galleryContent.classList.remove('expanded');
            galleryContent.classList.add('collapsed');
            galleryToggleIcon.classList.remove('rotated');
        }
    });

    
    function loadGalleryCards() {
        const items = JSON.parse(localStorage.getItem('scribbleverse_archive') || '[]');
        archiveCountLabel.textContent = items.length;
        
        if (items.length === 0) {
            galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <i class="fa-solid fa-box-open"></i>
                    <p>No saved works yet. Generate a poem, then click "Save to Gallery" to fill your sketchbook archive.</p>
                </div>
            `;
            return;
        }

        
        galleryGrid.innerHTML = "";
        
        items.slice().reverse().forEach((item, index) => {
            
            const originalIndex = items.length - 1 - index;
            
            const card = document.createElement('div');
            card.className = "archive-card";
            card.dataset.id = item.id;
            
            card.innerHTML = `
                <div class="archive-card-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="archive-card-info">
                    <h4 class="archive-card-title">${item.title}</h4>
                    <p class="archive-card-snippet">${item.body.split('\n')[0]}...</p>
                </div>
                <div class="archive-card-meta">
                    <span>${item.date}</span>
                    <button class="btn-card-delete" data-index="${originalIndex}" title="Delete entry">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            
            
            card.addEventListener('click', (e) => {
                
                if (e.target.closest('.btn-card-delete')) return;
                
                
                activePoem = {
                    title: item.title,
                    body: item.body,
                    meta: item.meta
                };
                
                poetryDisplayArea.classList.add('hidden');
                typedPoemContainer.classList.remove('hidden');
                poetryActions.style.display = 'flex';
                
                
                typedTitle.innerHTML = item.title;
                
                
                typedBody.innerHTML = item.body.split('\n\n').map(stanza => `<p>${stanza.replace(/\n/g, '<br>')}</p>`).join('');
                poemSignature.innerHTML = item.meta;
                
                
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
                    saveState();
                    strokeCount = 20;
                    updateDrawingStatusLabel();
                };
                img.src = item.image;
            });
            
            galleryGrid.appendChild(card);
        });

        
        const deleteButtons = galleryGrid.querySelectorAll('.btn-card-delete');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                if (confirm("Delete this artwork and poem from your sketchbook archive?")) {
                    const currentItems = JSON.parse(localStorage.getItem('scribbleverse_archive') || '[]');
                    currentItems.splice(idx, 1);
                    localStorage.setItem('scribbleverse_archive', JSON.stringify(currentItems));
                    loadGalleryCards();
                }
            });
        });
    }

    
    btnSaveArchive.addEventListener('click', () => {
        if (!activePoem.title || !activePoem.body) return;
        
        const items = JSON.parse(localStorage.getItem('scribbleverse_archive') || '[]');
        
        
        const dpr = window.devicePixelRatio || 1;
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 320;
        thumbCanvas.height = 240;
        const thumbCtx = thumbCanvas.getContext('2d');
        
        thumbCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 320, 240);
        
        const item = {
            id: Date.now(),
            title: activePoem.title,
            body: activePoem.body,
            meta: activePoem.meta,
            image: thumbCanvas.toDataURL('image/jpeg', 0.85),
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
        };
        
        items.push(item);
        localStorage.setItem('scribbleverse_archive', JSON.stringify(items));
        
        archiveCountLabel.textContent = items.length;
        alert("Scribble saved successfully to Sketchbook Archive!");
        
        
        if (galleryContent.classList.contains('collapsed')) {
            btnGalleryToggle.click();
        } else {
            loadGalleryCards();
        }
    });

    
    btnCopyText.addEventListener('click', () => {
        const text = `${activePoem.title}\n\n${activePoem.body}\n\n---\n${activePoem.meta}`;
        navigator.clipboard.writeText(text)
            .then(() => alert("Poem text copied to clipboard!"))
            .catch(err => console.error("Clipboard copy failed:", err));
    });

    
    const initialItems = JSON.parse(localStorage.getItem('scribbleverse_archive') || '[]');
    archiveCountLabel.textContent = initialItems.length;
    btnExportCard.addEventListener('click', () => {
        if (!activePoem.title || !activePoem.body) return;

        
        const cardWidth = 800;
        const cardHeight = 1100;
        
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = cardWidth;
        cardCanvas.height = cardHeight;
        const cardCtx = cardCanvas.getContext('2d');
        
        
        cardCtx.fillStyle = '#FFFDF9';
        cardCtx.fillRect(0, 0, cardWidth, cardHeight);
        
        
        const paperVignette = cardCtx.createRadialGradient(cardWidth/2, cardHeight/2, cardWidth/3, cardWidth/2, cardHeight/2, cardWidth);
        paperVignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
        paperVignette.addColorStop(1, 'rgba(79, 70, 60, 0.04)');
        cardCtx.fillStyle = paperVignette;
        cardCtx.fillRect(0, 0, cardWidth, cardHeight);
        
        
        cardCtx.strokeStyle = '#4F3B2F';
        cardCtx.lineWidth = 2;
        cardCtx.strokeRect(30, 30, cardWidth - 60, cardHeight - 60);
        
        cardCtx.strokeStyle = 'rgba(79, 70, 60, 0.2)';
        cardCtx.lineWidth = 1;
        cardCtx.strokeRect(36, 36, cardWidth - 72, cardHeight - 72);

        
        const doodleX = 100;
        const doodleY = 80;
        const doodleW = 600;
        const doodleH = 450;
        
        
        cardCtx.fillStyle = '#FAF6F0';
        cardCtx.fillRect(doodleX - 10, doodleY - 10, doodleW + 20, doodleH + 20);
        cardCtx.strokeStyle = '#D1C8BC';
        cardCtx.lineWidth = 1;
        cardCtx.strokeRect(doodleX - 10, doodleY - 10, doodleW + 20, doodleH + 20);

        
        cardCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, doodleX, doodleY, doodleW, doodleH);

        
        const textStartY = 610;
        cardCtx.strokeStyle = 'rgba(197, 160, 89, 0.08)';
        cardCtx.lineWidth = 1;
        for (let l = textStartY; l < cardHeight - 120; l += 28) {
            cardCtx.beginPath();
            cardCtx.moveTo(80, l);
            cardCtx.lineTo(cardWidth - 80, l);
            cardCtx.stroke();
        }

        
        
        cardCtx.fillStyle = '#242220';
        cardCtx.textAlign = 'center';
        
        
        cardCtx.font = 'bold 22px "Special Elite", "Courier New", Courier, monospace';
        cardCtx.fillText(activePoem.title, cardWidth / 2, textStartY + 15);
        
        
        cardCtx.font = '17px "Special Elite", "Courier New", Courier, monospace';
        cardCtx.textAlign = 'left';
        
        const bodyLines = activePoem.body.split('\n');
        let currentY = textStartY + 60;
        const maxLineWidth = 640;
        const lineSpacing = 26;

        bodyLines.forEach(lineText => {
            
            if (lineText.trim() === "") {
                currentY += 15;
                return;
            }
            
            
            const words = lineText.split(' ');
            let line = '';
            
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = cardCtx.measureText(testLine);
                if (metrics.width > maxLineWidth && n > 0) {
                    cardCtx.fillText(line, 80, currentY);
                    line = words[n] + ' ';
                    currentY += lineSpacing;
                } else {
                    line = testLine;
                }
            }
            cardCtx.fillText(line, 80, currentY);
            currentY += lineSpacing;
        });

        
        cardCtx.font = 'italic 15px "EB Garamond", Georgia, serif';
        cardCtx.textAlign = 'right';
        cardCtx.fillStyle = '#6E675F';
        cardCtx.fillText(activePoem.meta, cardWidth - 80, cardHeight - 80);
        
        cardCtx.font = 'italic 12px "EB Garamond", Georgia, serif';
        cardCtx.fillText("Created with ScribbleVerse", cardWidth - 80, cardHeight - 60);

        
        const link = document.createElement('a');
        const fileTitle = activePoem.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        link.download = `scribbleverse_${fileTitle}.png`;
        link.href = cardCanvas.toDataURL('image/png');
        link.click();
    });
    let isSpeaking = false;
    let speechUtterance = null;

    btnSpeakPoem.addEventListener('click', () => {
        if (!activePoem.title || !activePoem.body) return;
        
        if (isSpeaking) {
            
            window.speechSynthesis.cancel();
            setSpeakingState(false);
            return;
        }
        
        
        const textToSpeak = `${activePoem.title}. \n\n ${activePoem.body}`;
        
        speechUtterance = new SpeechSynthesisUtterance(textToSpeak);
        speechUtterance.rate = 0.85;
        speechUtterance.pitch = 1.0;
        speechUtterance.volume = 1.0;
        
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google UK English Female') ||
            v.name.includes('Google US English') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Daniel') ||
            (v.lang.startsWith('en') && v.localService === false)
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        if (preferredVoice) {
            speechUtterance.voice = preferredVoice;
        }
        
        speechUtterance.onstart = () => setSpeakingState(true);
        speechUtterance.onend = () => setSpeakingState(false);
        speechUtterance.onerror = () => setSpeakingState(false);
        
        window.speechSynthesis.speak(speechUtterance);
    });

    function setSpeakingState(speaking) {
        isSpeaking = speaking;
        if (speaking) {
            btnSpeakPoem.classList.add('speaking');
            speakBtnText.textContent = 'Stop';
            btnSpeakPoem.querySelector('i').className = 'fa-solid fa-stop';
        } else {
            btnSpeakPoem.classList.remove('speaking');
            speakBtnText.textContent = 'Speak Poem';
            btnSpeakPoem.querySelector('i').className = 'fa-solid fa-volume-high';
        }
    }

    
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    
    loadKeyConfigState();
});



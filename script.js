/**
 * PAINTING IS LIFE - Çizim Motoru Çekirdeği
 * Kıdemli Yazılım Mimarı Standartlarında Optimize Edilmiştir.
 */

class DrawingEngine {
    constructor() {
        this.initDOM();
        this.initProperties();
        this.bindEvents();
        this.resizeCanvas();
    }

    initDOM() {
        this.canvas = document.getElementById('engineCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // Arayüz Sürücüleri
        this.sliderSize = document.getElementById('sliderSize');
        this.sliderOpacity = document.getElementById('sliderOpacity');
        this.lblSize = document.getElementById('lblSize');
        this.lblOpacity = document.getElementById('lblOpacity');
        this.nativePicker = document.getElementById('nativeColorPicker');
        this.staticPalette = document.getElementById('staticPalette');
        this.clearBtn = document.getElementById('clearBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
    }

    initProperties() {
        this.isDrawing = false;
        this.currentTool = 'pen'; 
        this.activeColor = '#4f46e5';
        this.pointsBuffer = []; // Bezier yumuşatma interpolasyon havuzu
        
        // Profesyonel Geçmiş Geçiş Modülü (History Track)
        this.historyStack = [];
        this.redoStack = [];
        this.maxHistorySize = 30;
    }

    bindEvents() {
        // Pointer Events API (Mouse, Apple Pencil, Android Stylus ve Dokunmatiği Tek Çatıda Eşzamanlar)
        this.canvas.addEventListener('pointerdown', (e) => this.startStroke(e));
        this.canvas.addEventListener('pointermove', (e) => {
            // Güvenli kare hızı optimizasyonu (Hassas girdi darboğazını önler)
            e.preventDefault();
            this.executeStroke(e);
        });
        window.addEventListener('pointerup', () => this.endStroke());

        // Girdi Ayar Dinleyicileri
        this.sliderSize.addEventListener('input', (e) => this.lblSize.textContent = `${e.target.value}px`);
        this.sliderOpacity.addEventListener('input', (e) => this.lblOpacity.textContent = `${e.target.value}%`);

        // Araç Matrisi Seçimi
        document.querySelectorAll('.tool-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                document.querySelector('.tool-cell.active').classList.remove('active');
                const target = e.target.closest('.tool-cell');
                target.classList.add('active');
                this.currentTool = target.dataset.tool;
            });
        });

        // Renk Yönetimi Tetikleyicileri
        this.nativePicker.addEventListener('input', (e) => {
            this.activeColor = e.target.value;
            document.querySelector('.palette-swatch.active')?.classList.remove('active');
        });

        this.staticPalette.addEventListener('click', (e) => {
            if (e.target.classList.contains('palette-swatch')) {
                document.querySelector('.palette-swatch.active')?.classList.remove('active');
                e.target.classList.add('active');
                this.activeColor = e.target.dataset.hex;
                this.nativePicker.value = this.activeColor;
            }
        });

        // Global Aksiyon Atamaları
        this.clearBtn.addEventListener('click', () => this.clearCanvasContext());
        this.exportBtn.addEventListener('click', () => this.exportHighResPNG());
        this.undoBtn.addEventListener('click', () => this.stepHistoryBack());
        this.redoBtn.addEventListener('click', () => this.stepHistoryForward());

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const widthModifier = window.innerWidth > 1024 ? 520 : 0;
        const heightModifier = 64;

        this.canvas.width = (window.innerWidth - widthModifier) * dpr;
        this.canvas.height = (window.innerHeight - heightModifier) * dpr;
        this.canvas.style.width = (window.innerWidth - widthModifier) + 'px';
        this.canvas.style.height = (window.innerHeight - heightModifier) + 'px';

        this.ctx.scale(dpr, dpr);
        
        // İlk açılışta tuvali saf beyaza boya
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Geçmiş hafızasını tetikle
        this.commitState();
    }

    parseRGBA(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    }

    startStroke(e) {
        this.isDrawing = true;
        this.pointsBuffer = [];
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowBlur = 0; // Varsayılan gölge sıfırlama

        const coords = this.fetchInputCoordinates(e);
        this.pointsBuffer.push({ x: coords.x, y: coords.y });
        
        if (this.currentTool === 'spray') this.executeStroke(e);
    }

    executeStroke(e) {
        if (!this.isDrawing) return;

        const coords = this.fetchInputCoordinates(e);
        const size = parseFloat(this.sliderSize.value);
        const opacity = parseFloat(this.sliderOpacity.value);

        // Algoritmik Fırça Çeşitleri Motoru
        if (this.currentTool === 'spray') {
            const density = 30;
            for (let i = 0; i < density; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * size;
                const sX = coords.x + Math.cos(angle) * radius;
                const sY = coords.y + Math.sin(angle) * radius;
                this.ctx.fillStyle = this.parseRGBA(this.activeColor, opacity);
                this.ctx.fillRect(sX, sY, 1, 1);
            }
            return;
        }

        this.pointsBuffer.push({ x: coords.x, y: coords.y });
        if (this.pointsBuffer.length < 3) return;

        this.ctx.beginPath();
        this.ctx.moveTo(this.pointsBuffer[0].x, this.pointsBuffer[0].y);

        // Profesyonel Matematiksel Yumuşatma: Matematiksel Bezier Eğrisi (Lag/Kesinti Önleyici)
        let i;
        for (i = 1; i < this.pointsBuffer.length - 2; i++) {
            const xc = (this.pointsBuffer[i].x + this.pointsBuffer[i + 1].x) / 2;
            const yc = (this.pointsBuffer[i].y + this.pointsBuffer[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(this.pointsBuffer[i].x, this.pointsBuffer[i].y, xc, yc);
        }

        // Kapanış noktalarını bağla
        this.ctx.quadraticCurveTo(this.pointsBuffer[i].x, this.pointsBuffer[i].y, this.pointsBuffer[i + 1].x, this.pointsBuffer[i + 1].y);

        // Araç Profil Ayarlamaları
        if (this.currentTool === 'eraser') {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = size;
        } else {
            this.ctx.strokeStyle = this.parseRGBA(this.activeColor, opacity);
            if (this.currentTool === 'pen') this.ctx.lineWidth = size * 0.4;
            if (this.currentTool === 'brush') this.ctx.lineWidth = size;
            if (this.currentTool === 'marker') this.ctx.lineWidth = size * 1.5;
            if (this.currentTool === 'glow') {
                this.ctx.lineWidth = size;
                this.ctx.shadowBlur = size * 0.5;
                this.ctx.shadowColor = this.activeColor;
            }
        }

        this.ctx.stroke();

        // Performans Optimizasyonu: Bellek şişmesini önlemek amacıyla eski dizileri daralt
        if (this.pointsBuffer.length > 15) this.pointsBuffer.shift();
    }

    endStroke() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.commitState(); // Çizim bittiğinde diske (ram) yaz
        }
    }

    fetchInputCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
            y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
        };
    }

    // Tarihçe Yönetim Merkezi (State Management)
    commitState() {
        if (this.historyStack.length >= this.maxHistorySize) this.historyStack.shift();
        this.historyStack.push(this.canvas.toDataURL());
        this.redoStack = [];
        this.updateHistoryButtons();
    }

    stepHistoryBack() {
        if (this.historyStack.length > 1) {
            this.redoStack.push(this.historyStack.pop());
            this.applyStateToCanvas(this.historyStack[this.historyStack.length - 1]);
        }
    }

    stepHistoryForward() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.historyStack.push(state);
            this.applyStateToCanvas(state);
        }
    }

    applyStateToCanvas(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1));
            this.updateHistoryButtons();
        };
    }

    updateHistoryButtons() {
        this.undoBtn.disabled = this.historyStack.length <= 1;
        this.redoBtn.disabled = this.redoStack.length === 0;
    }

    clearCanvasContext() {
        if (confirm('PAINTING IS LIFE: Bu projeyi sıfırlamak istediğinize emin misiniz?')) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.commitState();
        }
    }

    exportHighResPNG() {
        const link = document.createElement('a');
        link.download = 'painting-is-life-masterpiece.png';
        link.href = this.canvas.toDataURL('image/png', 1.0);
        link.click();
    }
}

// Çekirdeği Başlat
window.addEventListener('DOMContentLoaded', () => new DrawingEngine());
                                    

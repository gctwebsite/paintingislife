const canvas = document.getElementById('ultraCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Element Bağlantıları
const colorPicker = document.getElementById('colorPicker');
const sizeSlider = document.getElementById('sizeSlider');
const sizeVal = document.getElementById('sizeVal');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const toolIcons = document.querySelectorAll('.tool-icon');

// Sistem Durumu
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush'; // brush, eraser, spray, glow

// Ekran / Cihaz Duyarlı Boyutlandırma Motoru (PC, Tablet, Telefon Sınırsız Uyum)
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const sidebarWidth = window.innerWidth > 768 ? 290 : 70; // Paneller dahil genişlik hesabı
    
    canvas.width = (window.innerWidth - sidebarWidth) * dpr;
    canvas.height = (window.innerHeight - 110) * dpr;
    canvas.style.width = (window.innerWidth - sidebarWidth) + 'px';
    canvas.style.height = (window.innerHeight - 110) + 'px';
    
    ctx.scale(dpr, dpr);
    
    // Arka planı koru ve beyaz yap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setupBrushQuality();
}

function setupBrushQuality() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// Hex kodunu şeffaf RGBA formatına çeviren motor
function getRGBAColor(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Gelişmiş Çizim Motoru
function draw(e) {
    if (!isDrawing) return;

    // Koordinatları Al (Fare veya Dokunmatik Algılama)
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const size = sizeSlider.value;
    const opacity = opacitySlider.value;
    const color = colorPicker.value;

    ctx.lineWidth = size;

    if (currentTool === 'eraser') {
        // Silgi Modu
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'brush') {
        // Standart İllüstrasyon Fırçası
        ctx.strokeStyle = getRGBAColor(color, opacity);
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'glow') {
        // Neon / Parlama Etkili Fırça
        ctx.strokeStyle = getRGBAColor(color, opacity);
        ctx.shadowBlur = size / 2;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'spray') {
        // Dijital Sprey (Airbrush) Algoritması
        ctx.shadowBlur = 0;
        const density = 30;
        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * size;
            const sprayX = x + Math.cos(angle) * radius;
            const sprayY = y + Math.sin(angle) * radius;
            ctx.fillStyle = getRGBAColor(color, opacity);
            ctx.fillRect(sprayX, sprayY, 1, 1);
        }
    }

    [lastX, lastY] = [x, y];
}

// Çizim Başlangıç Noktası Sabitleyici
function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    [lastX, lastY] = [clientX - rect.left, clientY - rect.top];
}

// Pointer Events (Hem mouse, hem dokunmatik ekranları tek kodda en yüksek hızda çalıştırır)
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
window.addEventListener('pointerup', () => isDrawing = false);

// Dinamik Sürgü (Slider) Değer Değişimleri
sizeSlider.addEventListener('input', (e) => sizeVal.textContent = e.target.value);
opacitySlider.addEventListener('input', (e) => opacityVal.textContent = e.target.value);

// Araç Seçim Yönetimi
toolIcons.forEach(tool => {
    tool.addEventListener('click', (e) => {
        document.querySelector('.tool-icon.active').classList.remove('active');
        e.target.classList.add('active');
        currentTool = e.target.id;
    });
});

// Ekranı Sıfırlama
clearBtn.addEventListener('click', () => {
    if (confirm('PAINTING IS LIFE: Bu çalışmayı temizlemek istediğinizden emin misiniz?')) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setupBrushQuality();
    }
});

// Yüksek Kaliteli PNG Dışa Aktarma
exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'painting-is-life-art.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});

// İlk Yükleme Tetikleyicisi
window.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});
      

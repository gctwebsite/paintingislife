const canvas = document.getElementById('sketchCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Arayüz Element Seçicileri
const sizeSlider = document.getElementById('sizeSlider');
const sizeVal = document.getElementById('sizeVal');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const globalColorPicker = document.getElementById('globalColorPicker');
const quickPalette = document.getElementById('quickPalette');
const toolBtns = document.querySelectorAll('.tool-btn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// Durum Takip Belleği (State)
let isDrawing = false;
let currentTool = 'pen'; // pen, brush, marker, glow, spray, eraser
let activeColor = '#4f46e5';
let points = []; // Akıcı çizim (Bezier Eğrisi) için nokta koordinat deposu

// Geri / İleri Al Sistemi (Undo-Redo Tarihçesi)
let undoStack = [];
let redoStack = [];
const maxHistory = 25; // Tarayıcı hafızasını yormayacak maksimum geri alma limiti

// Uygulama ve Tuval Adaptasyon Motoru
function adjustCanvasEngine() {
    const dpr = window.devicePixelRatio || 1;
    // Paneller hesaba katılarak tuval boyutu çıkarılır
    const horizontalMargin = window.innerWidth > 1024 ? 540 : 0;
    const verticalMargin = 60;

    canvas.width = (window.innerWidth - horizontalMargin) * dpr;
    canvas.height = (window.innerHeight - verticalMargin) * dpr;
    canvas.style.width = (window.innerWidth - horizontalMargin) + 'px';
    canvas.style.height = (window.innerHeight - verticalMargin) + 'px';

    ctx.scale(dpr, dpr);
    
    // Beyaz arka plan sabitlemesi
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    saveState(); // İlk boş ekran durumunu hafızaya al
}

// Kalite Yapılandırması
function setContextSettings() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
}

// Renk Dönüştürücü (HEX to RGBA)
function hexToRGBA(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Geçmiş Kayıt Fonksiyonu (Undo/Redo Altyapısı)
function saveState() {
    if (undoStack.length >= maxHistory) undoStack.shift();
    undoStack.push(canvas.toDataURL());
    redoStack = []; // Yeni çizimde ileri alma havuzunu boşalt
}

// Geri Al Motoru
undoBtn.addEventListener('click', () => {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        restoreCanvas(undoStack[undoStack.length - 1]);
    }
});

// İleri Al Motoru
redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        restoreCanvas(state);
    }
});

function restoreCanvas(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // DPR ölçeğine sadık kalarak resmi yeniden çizdirme
        ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
}

// Çizim Başlama Anı
function startDrawing(e) {
    isDrawing = true;
    setContextSettings();
    points = []; // Noktaları sıfırla
    
    const coord = getCoordinates(e);
    points.push({ x: coord.x, y: coord.y });
    
    if (currentTool === 'spray') {
        draw(e);
    }
}

// Ana Çizim ve Akıcılık (Interpolation) Motoru
function draw(e) {
    if (!isDrawing) return;

    const coord = getCoordinates(e);
    const size = parseFloat(sizeSlider.value);
    const opacity = parseFloat(opacitySlider.value);

    if (currentTool === 'spray') {
        // Sprey Efekti
        ctx.shadowBlur = 0;
        const density = 25;
        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * size;
            const sX = coord.x + Math.cos(angle) * radius;
            const sY = coord.y + Math.sin(angle) * radius;
            ctx.fillStyle = hexToRGBA(activeColor, opacity);
            ctx.fillRect(sX, sY, 1, 1);
        }
        return;
    }

    points.push({ x: coord.x, y: coord.y });

    if (points.length < 3) return;

    ctx.beginPath();
    // Akıcı hatlar sağlamak için fırçayı önceki merkez noktasına kaydırıyoruz
    ctx.moveTo(points[0].x, points[0].y);

    // Bezier Eğrisi ile Köşeleri Yumuşatma Algoritması (Yağ gibi akma hissi)
    for (var i = 1; i < points.length - 2; i++) {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    // Son iki noktayı bağlama
    ctx.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);

    // Araç Tiplerine Göre Fırça Ayarları
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
    } else if (currentTool === 'pen') {
        ctx.strokeStyle = hexToRGBA(activeColor, opacity);
        ctx.lineWidth = size * 0.5; // Kalem daha incedir
    } else if (currentTool === 'brush') {
        ctx.strokeStyle = hexToRGBA(activeColor, opacity);
        ctx.lineWidth = size;
    } else if (currentTool === 'marker') {
        ctx.strokeStyle = hexToRGBA(activeColor, opacity * 0.6); // Yarı şeffaf geçiş
        ctx.lineWidth = size * 1.4;
    } else if (currentTool === 'glow') {
        ctx.strokeStyle = hexToRGBA(activeColor, opacity);
        ctx.lineWidth = size;
        ctx.shadowBlur = size * 0.6;
        ctx.shadowColor = activeColor;
    }

    ctx.stroke();
    
    // Bellek şişmesini önlemek için eskiyen noktaları temizle
    if (points.length > 20) {
        points.shift();
    }
}

// Çizim Bitiş Noktası
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveState(); // Çizgi bittiği an ekrandaki son durumu tarihe yaz
    }
}

// Koordinat Çözümleme Adaptörü (Mouse & Touch Ortak)
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Pointer Dinleyicileri (En yüksek girdi hızı için pointer eventleri kullanıldı)
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
window.addEventListener('pointerup', stopDrawing);

// Sürgü Gösterge Dinleyicileri
sizeSlider.addEventListener('input', (e) => sizeVal.textContent = e.target.value + 'px');
opacitySlider.addEventListener('input', (e) => opacityVal.textContent = e.target.value + '%');

// Araç Seçim Paneli Yönetimi
toolBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        const target = e.target.closest('.tool-btn');
        target.classList.add('active');
        currentTool = target.dataset.type;
    });
});

// Gelişmiş Renk Seçici Dinleyicisi
globalColorPicker.addEventListener('input', (e) => {
    activeColor = e.target.value;
    document.querySelector('.palette-color.active')?.classList.remove('active');
});

// Hızlı Renk Paleti Seçimleri
quickPalette.addEventListener('click', (e) => {
    if (e.target.classList.contains('palette-color')) {
        document.querySelector('.palette-color.active')?.classList.remove('active');
        e.target.classList.add('active');
        activeColor = e.target.dataset.color;
        globalColorPicker.value = activeColor;
    }
});

// Tümünü Temizleme Fonksiyonu
clearBtn.addEventListener('click', () => {
    if (confirm('PAINTING IS LIFE: Bu şaheseri sıfırlamak istediğinizden emin misiniz?')) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
});

// Profesyonel 4K PNG İndirme Çıktısı
exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'painting-is-life-sketch.png';
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});

// Başlatıcı Kurulum Kontrolü
window.addEventListener('DOMContentLoaded', () => {
    adjustCanvasEngine();
    window.addEventListener('resize', adjustCanvasEngine);
});
            

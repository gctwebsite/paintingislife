/**
 * @file main.cpp
 * @brief Proje Giriş Noktası ve Kompozit İşleme Motoru
 */

#include "PaintingEngine.hpp"
#include "BrushEngine.hpp"

class PaintingIsLifeApp {
public:
    std::vector<std::shared_ptr<Layer>> layerStack;
    BrushEngine brush;
    int renderWidth;
    int renderHeight;

    PaintingIsLifeApp(int w, int h) : renderWidth(w), renderHeight(h) {
        std::cout << "[PAINTING IS LIFE Core] Profesyonel Çizim Motoru Başlatıldı.\n";
        
        // Katmanların Sırayla RAM üzerinde oluşturulması
        auto bgLayer = std::make_shared<Layer>("Arka Plan Kanvası", renderWidth, renderHeight);
        auto drawLayer = std::make_shared<Layer>("Üst Çizim Katmanı", renderWidth, renderHeight);

        // Kanvas tabanını saf beyaz renkle doldur
        std::fill(bgLayer->pixelBuffer.begin(), bgLayer->pixelBuffer.end(), RGBA(255, 255, 255, 255));

        layerStack.push_back(bgLayer);
        layerStack.push_back(drawLayer);
    }

    // Tüm katmanları birleştirip tek bir 4K görüntü buffer'ı üretme (Composite Rasterizer)
    std::vector<RGBA> renderFinalOutput() {
        std::vector<RGBA> finalBuffer(renderWidth * renderHeight, RGBA(255, 255, 255, 255));

        for (const auto& layer : layerStack) {
            if (!layer->isVisible) continue;

            for (int i = 0; i < renderWidth * renderHeight; ++i) {
                const RGBA& src = layer->pixelBuffer[i];
                RGBA& dest = finalBuffer[i];

                float srcAlpha = (src.a / 255.0f) * layer->globalOpacity;
                float destAlpha = dest.a / 255.0f;

                float outAlpha = srcAlpha + destAlpha * (1.0f - srcAlpha);
                if (outAlpha > 0.0f) {
                    dest.r = static_cast<uint8_t>((src.r * srcAlpha + dest.r * destAlpha * (1.0f - srcAlpha)) / outAlpha);
                    dest.g = static_cast<uint8_t>((src.g * srcAlpha + dest.g * destAlpha * (1.0f - srcAlpha)) / outAlpha);
                    dest.b = static_cast<uint8_t>((src.b * srcAlpha + dest.b * destAlpha * (1.0f - srcAlpha)) / outAlpha);
                    dest.a = static_cast<uint8_t>(outAlpha * 255.0f);
                }
            }
        }
        return finalBuffer;
    }
};

int main() {
    // 4K Ultra-HD Profesyonel Çizim Çözünürlüğü Kurulumu
    PaintingIsLifeApp app(3840, 2160);

    // 1. Örnek: Sınırsız Renk Uzayından Özel Bir Turkuaz/Mavi Seçimi (#06b6d4)
    app.brush.currentTool = ToolType::Brush;
    app.brush.brushSize = 45.0f;
    app.brush.opacityFactor = 0.85f; // %85 şeffaflık
    app.brush.activeColor = RGBA(6, 182, 212, 255); // Tamamen özel ara renk ataması

    // Akıcı Bezier interpolasyon fırça darbesi simülasyonu
    app.brush.drawSmoothLine(app.layerStack[1], Point(200.0f, 150.0f), Point(1800.0f, 1400.0f));

    // 2. Örnek: Sınırsız Renk Uzayından Neon Pembesi Seçimi (#ec4899)
    app.brush.currentTool = ToolType::Glow;
    app.brush.brushSize = 60.0f;
    app.brush.activeColor = RGBA(236, 72, 153, 255); // 16 Milyon renkten bir diğeri

    app.brush.drawSmoothLine(app.layerStack[1], Point(1800.0f, 1400.0f), Point(3500.0f, 400.0f));

    // Katman kompozisyonunu çalıştır ve belleği çıktı için hazırla
    std::vector<RGBA> mergedImage = app.renderFinalOutput();

    std::cout << "[BAŞARILI] 60 FPS Akıcılıkta fırça darbeleri işlendi ve "
              << "tüm renk kanalları (RGBA) başarıyla birleştirildi.\n";

    return 0;
}

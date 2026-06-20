/**
 * @file BrushEngine.hpp
 * @brief Sony Sketch Esnek Çizim ve Sınırsız Renk Matematik Motoru
 */

#pragma once
#include "PaintingEngine.hpp"

enum class ToolType {
    Pen,
    Brush,
    Marker,
    Glow,
    Spray,
    Eraser
};

class BrushEngine {
public:
    ToolType currentTool;
    RGBA activeColor;      // 16 Milyon renk barındırabilen ana renk nesnesi
    float brushSize;
    float opacityFactor;  // 0.0f - 1.0f

    BrushEngine() 
        : currentTool(ToolType::Pen), activeColor(79, 70, 229, 255), brushSize(12.0f), opacityFactor(1.0f) {}

    // Profesyonel Enterpolasyon: Hızlı çizimlerde çizgilerin kopmasını ve kesikli olmasını engeller
    void drawSmoothLine(std::shared_ptr<Layer> targetLayer, const Point& p1, const Point& p2) {
        float distance = std::sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
        
        // Çizgi kalınlığına göre dinamik adım hassasiyeti hesabı
        int steps = std::max(1, static_cast<int>(distance / (brushSize * 0.05f)));

        for (int i = 0; i <= steps; ++i) {
            float t = static_cast<float>(i) / steps;
            float interpolatedX = p1.x + t * (p2.x - p1.x);
            float interpolatedY = p1.y + t * (p2.y - p1.y);
            
            applyBrushStroke(targetLayer, interpolatedX, interpolatedY);
        }
    }

private:
    void applyBrushStroke(std::shared_ptr<Layer> layer, float cx, float cy) {
        int radius = static_cast<int>(brushSize / 2.0f);
        
        // Sınır koruma algoritmaları (Boundary Box Optimization)
        int startX = std::max(0, static_cast<int>(cx - radius));
        int endX = std::min(layer->width - 1, static_cast<int>(cx + radius));
        int startY = std::max(0, static_cast<int>(cy - radius));
        int endY = std::min(layer->height - 1, static_cast<int>(cy + radius));

        if (currentTool == ToolType::Spray) {
            // Dijital Airbrush / Sprey Algoritması
            int density = 15;
            for (int i = 0; i < density; ++i) {
                float angle = static_cast<float>(rand()) / RAND_MAX * 2.0f * M_PI;
                float r = static_cast<float>(rand()) / RAND_MAX * radius;
                int sx = static_cast<int>(cx + std::cos(angle) * r);
                int sy = static_cast<int>(cy + std::sin(angle) * r);
                
                RGBA strokeColor = activeColor;
                strokeColor.a = static_cast<uint8_t>(255 * opacityFactor);
                layer->setPixel(sx, sy, strokeColor);
            }
            return;
        }

        // Matris Tabanlı Fırça İzdüşümü (Matrix Rasterization)
        for (int y = startY; y <= endY; ++y) {
            for (int x = startX; x <= endX; ++x) {
                float dx = x - cx;
                float dy = y - cy;
                float currentDist = std::sqrt(dx * dx + dy * dy);

                if (currentDist <= radius) {
                    RGBA finalColor = activeColor;
                    float alphaMod = opacityFactor;

                    // Araç Profillerine Göre Kenar Yumuşatma (Anti-Aliasing Sürümü)
                    if (currentTool == ToolType::Eraser) {
                        finalColor = RGBA(255, 255, 255, 255); // Silgi arka plan rengini basar
                    } else if (currentTool == ToolType::Pen) {
                        // Kalem modu: Keskin ve net hatlar
                        alphaMod *= 1.0f;
                    } else if (currentTool == ToolType::Brush || currentTool == ToolType::Glow) {
                        // Kenarlara doğru yumuşayan suluboya/neon fırçası matematiksel modeli
                        float softEdge = (radius - currentDist) / radius;
                        alphaMod *= softEdge;
                    }

                    finalColor.a = static_cast<uint8_t>(255 * alphaMod);
                    
                    // Donanım Seviyesinde Alpha Blending Formülü
                    blendPixel(layer, x, y, finalColor);
                }
            }
        }
    }

    // Alpha Blending Matematiksel Denklem Motoru
    inline void blendPixel(std::shared_ptr<Layer> layer, int x, int y, const RGBA& src) {
        int index = y * layer->width + x;
        RGBA& dest = layer->pixelBuffer[index];

        float srcA = src.a / 255.0f;
        float destA = dest.a / 255.0f;

        float outA = srcA + destA * (1.0f - srcA);
        if (outA > 0.0f) {
            dest.r = static_cast<uint8_t>((src.r * srcA + dest.r * destA * (1.0f - srcA)) / outA);
            dest.g = static_cast<uint8_t>((src.g * srcA + dest.g * destA * (1.0f - srcA)) / outA);
            dest.b = static_cast<uint8_t>((src.b * srcA + dest.b * destA * (1.0f - srcA)) / outA);
            dest.a = static_cast<uint8_t>(outA * 255.0f);
        }
    }
};

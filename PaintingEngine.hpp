/**
 * @file PaintingEngine.hpp
 * @brief PAINTING IS LIFE - Ultra High-Performance Core Graphics Engine
 * @author Senior Systems & Graphics Architect
 */

#pragma once

#include <iostream>
#include <vector>
#include <memory>
#include <string>
#include <cmath>
#include <algorithm>
#include <cstdint>

// Sınırsız Renk Uzayı Yapısı (32-bit RGBA True Color)
struct RGBA {
    uint8_t r; // Kırmızı (0-255)
    uint8_t g; // Yeşil   (0-255)
    uint8_t b; // Mavi    (0-255)
    uint8_t a; // Opaklık  (0-255)

    RGBA() : r(0), g(0), b(0), a(255) {}
    RGBA(uint8_t red, uint8_t green, uint8_t blue, uint8_t alpha = 255)
        : r(red), g(green), blue(b), a(alpha) {}
};

// Nokta Koordinat Yapısı
struct Point {
    float x;
    float y;
    Point(float _x, float _y) : x(_x), y(_y) {}
};

// Katman (Layer) Veri Yapısı ve Bellek Yönetimi
class Layer {
public:
    std::string layerName;
    std::vector<RGBA> pixelBuffer;
    int width;
    int height;
    float globalOpacity; // 0.0f - 1.0f
    bool isVisible;

    Layer(const std::string& name, int w, int h)
        : layerName(name), width(w), height(h), globalOpacity(1.0f), isVisible(true) {
        // Bellek sızıntısını önlemek ve GPU dostu kalmak için vektörü önden rezerve ediyoruz
        pixelBuffer.resize(width * height, RGBA(0, 0, 0, 0)); // Şeffaf arka plan
    }

    inline void setPixel(int x, int y, const RGBA& color) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            pixelBuffer[y * width + x] = color;
        }
    }
};

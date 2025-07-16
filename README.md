# 🍏 HealthyScan – AI-powered Food Scanner & Recipe Generator

**HealthyScan** is a mobile app that helps users make healthier food choices by scanning food labels or barcodes, analyzing nutritional quality (NutriScore, NOVA, EcoScore), comparing prices from Romanian supermarkets, and generating personalized recipes using AI.

---

## 🚀 Features

- 📦 **Scan barcodes** and fetch product data via Open Food Facts
- 🔍 **Find best prices** online using Google Custom Search
- 🧠 **AI-generated alternatives** based on NutriScore (via Gemini)
- 🍽️ **Smart recipes** generated from available ingredients
- 🛒 **Save favorite recipes** locally
- 👤 **User accounts** with profile and authentication

---

## 🛠️ Tech Stack

### Frontend – *React Native + Expo*
- TypeScript
- AsyncStorage
- Expo Router
- Custom UI (LinearGradient, icons, bottom navbar)

### Backend – *FastAPI*
- Python 3.11
- SQLAlchemy + SQLite (async)
- Barcode decoding (OpenCV + pyzbar)
- Google Programmable Search Engine
- AI generation with Google Gemini
- JWT authentication

---

## 🔐 Environment Variables

Create a `.env` file in the backend folder:

```env
GOOGLE_API_KEY=your_google_key
GOOGLE_CX_ID=your_search_engine_id
GEMINI_API_KEY=your_gemini_key

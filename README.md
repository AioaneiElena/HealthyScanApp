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
```

✅ Step 1 – Clone the project
```bash
git clone https://github.com/AioaneiElena/HealthyScan.git
cd HealthyScan
```
✅ Step 2 – Backend setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend will be running at http://localhost:8000

✅ Step 3 – Frontend setup (open a new terminal or tab)
```bash
cd ../frontend
npm install
npx expo start
```
Now use the Expo Go app to scan the QR code from terminal or browser.

# Photos:
<img width="699" height="675" alt="Screenshot 2025-06-17 222339" src="https://github.com/user-attachments/assets/3d8f5f30-ea8b-4b98-823c-a78636b72b99" />
<img width="653" height="625" alt="Screenshot 2025-06-17 222545" src="https://github.com/user-attachments/assets/c9c60e42-fb8f-4ef4-90de-0e54fca2bace" />
<img width="1064" height="683" alt="Screenshot 2025-06-17 223523" src="https://github.com/user-attachments/assets/a603877f-1543-4055-bfa8-a51595684b09" />
<img width="948" height="611" alt="Screenshot 2025-06-17 224401" src="https://github.com/user-attachments/assets/8934bf00-c315-4137-abf2-4b105354ac79" />
<img width="707" height="679" alt="Screenshot 2025-06-17 225329" src="https://github.com/user-attachments/assets/cdca1c3c-b7cf-4a93-8d35-815e39ea27b2" />
<img width="1077" height="677" alt="Screenshot 2025-06-17 225750" src="https://github.com/user-attachments/assets/9dab2ef0-26bb-4d2d-9994-d40d75b1843e" />


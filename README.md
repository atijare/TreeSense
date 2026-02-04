# TreeSense - Tree Leaf Classification System

A web application that identifies tree species from leaf images using a deep learning model. The system uses a server-side API architecture to avoid browser compilation issues with large TensorFlow.js models.

## Prerequisites

- **Python 3.12** (or compatible version)
- **Node.js** and **npm** installed
- **Trained model files**:
  - `train/model.keras` - The trained Keras model
  - `train/class_mapping.json` - Class name mapping file

## Installation

### 1. Install Backend Dependencies

```powershell
cd server
python -m pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```powershell
npm install
```

## Running the Project

You need to run both the backend server and frontend in separate terminals.

### Step 1: Start the Backend Server

Open a terminal/PowerShell window and run:

```powershell
cd server
.\start_server.ps1
```

**Or manually:**
```powershell
cd server
python app.py
```

**Wait for this message:**
```
✅ Server ready! Listening on http://localhost:5000
```

**Keep this terminal open!** The server must stay running.

### Step 2: Start the Frontend

Open a **different terminal/PowerShell window** and run:

```powershell
npm run dev
```

**Wait for this message:**
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:8080/
```

### Step 3: Use the Application

1. Open your browser to `http://localhost:8080`
2. Click "Choose File"
3. Select a tree leaf image
4. View the classification results!

## Testing the Server

Before uploading an image, you can test if the server is working:

Open in your browser: **http://localhost:5000/health**

You should see:
```json
{"status":"ok","message":"Tree classification API is running"}
```

## Project Structure

- **Frontend**: React + TypeScript + Vite (runs on port 8080)
- **Backend**: Flask API server (runs on port 5000)
- **Model**: Keras MobileNetV2 model (160x160 input, 10 tree classes)
- **Communication**: Vite proxy routes `/api/*` to Flask server

## How It Works

1. **User uploads image** → Frontend receives file
2. **Frontend sends to API** → `POST /api/predict` (via Vite proxy)
3. **Vite proxies request** → Forwards to `http://127.0.0.1:5000/predict`
4. **Flask server processes** → Loads model, preprocesses image (160x160), runs prediction
5. **Server returns results** → JSON with className, confidence, top3, allProbabilities
6. **Frontend displays** → Shows results on `/results` page

## Troubleshooting

### "API server is not running"
- Make sure you ran `.\start_server.ps1` in the `server` folder
- Check that you see "Server ready!" message
- The server terminal must stay open
- Test the server directly: `http://localhost:5000/health`

### "ERR_BLOCKED_BY_CLIENT"
- This is usually an ad blocker issue
- Try disabling your ad blocker for localhost
- Or test in an incognito/private window with extensions disabled
- The Vite proxy should prevent this, but some ad blockers are aggressive

### "Cannot connect to API server"
- Make sure BOTH server and frontend are running
- Check that server shows "Listening on http://localhost:5000"
- Verify frontend is running on port 8080
- Try the health check URL in your browser first

### "Model not found"
- Check that `train/model.keras` exists
- Check that `train/class_mapping.json` exists
- Verify the file paths in `server/app.py` match your structure

### Port conflicts
- **Frontend**: Port 8080 (change in `vite.config.ts`)
- **Backend**: Port 5000 (change in `server/app.py` line 126)
- If you change ports, update both the Flask port and the Vite proxy target URL

### Server won't start
- Make sure Python 3.12 is installed
- Install dependencies: `cd server && python -m pip install -r requirements.txt`
- Check that model files exist in `train/` directory

## API Endpoints

### GET /health
Health check endpoint
- **Response**: `{"status": "ok", "message": "Tree classification API is running"}`

### POST /predict
Predict tree species from image
- **Request**: `multipart/form-data` with `image` file
- **Response**: 
```json
{
  "className": "Red_Maple",
  "confidence": 0.95,
  "top3": [
    {"className": "Red_Maple", "confidence": 0.95},
    {"className": "White_Oak", "confidence": 0.03},
    {"className": "Tulip_Poplar", "confidence": 0.02}
  ],
  "allProbabilities": [...]
}
```

## Notes

- The server loads the model once on startup (takes a few seconds)
- Predictions typically take 1-2 seconds per image
- The model supports 10 tree species classes
- Both terminals (server and frontend) must stay running while using the app


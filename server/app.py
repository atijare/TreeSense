"""
Flask server for tree leaf classification
Run this server and the frontend will call it instead of using TensorFlow.js
"""
import os

# Suppress TensorFlow INFO logs (set before importing TF)
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "1")

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import json

app = Flask(__name__)
CORS(app)  # Allow frontend to call this API

# Global variables for model and class mapping
model = None
class_mapping = None

def load_model():
    """Load the Keras model and class mapping"""
    global model, class_mapping
    
    if model is None:
        print("📦 Loading Keras model...")
        model_path = os.path.join(os.path.dirname(__file__), '..', 'train', 'model.keras')
        model = tf.keras.models.load_model(model_path)
        print(f"✅ Model loaded! Input shape: {model.input_shape}")
        
        # Load class mapping
        mapping_path = os.path.join(os.path.dirname(__file__), '..', 'train', 'class_mapping.json')
        with open(mapping_path, 'r') as f:
            class_mapping = json.load(f)
        print(f"✅ Class mapping loaded: {len(class_mapping)} classes")
    
    return model, class_mapping

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Tree classification API is running"})

@app.route('/predict', methods=['POST'])
def predict():
    """Predict tree species from uploaded image"""
    try:
        # Check if image is in request
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No image file selected"}), 400
        
        # Load model if not already loaded
        model, class_mapping = load_model()
        
        # Read and preprocess image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size (160x160 - matches training)
        image = image.resize((160, 160))
        
        # Convert to array and preprocess
        img_array = np.array(image).astype('float32') / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # Make prediction
        predictions = model.predict(img_array, verbose=0)
        probabilities = predictions[0]
        
        # Map to class names
        all_predictions = [
            {
                "className": class_mapping[str(i)],
                "confidence": float(prob)
            }
            for i, prob in enumerate(probabilities)
        ]
        
        # Sort by confidence
        sorted_predictions = sorted(all_predictions, key=lambda x: x['confidence'], reverse=True)
        
        # Get top prediction and top 3
        top_prediction = sorted_predictions[0]
        top3 = sorted_predictions[:3]
        
        return jsonify({
            "className": top_prediction["className"],
            "confidence": top_prediction["confidence"],
            "top3": top3,
            "allProbabilities": all_predictions
        })
        
    except Exception as e:
        print(f"❌ Error during prediction: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Tree Classification API Server...")
    print("=" * 60)
    print("📝 Make sure you have:")
    print("   1. model.keras in the train/ directory")
    print("   2. class_mapping.json in the train/ directory")
    print("   3. Required packages installed (flask, flask-cors, tensorflow, pillow)")
    print("=" * 60)
    
    # Load model on startup
    try:
        load_model()
        print("\n✅ Server ready! Listening on http://localhost:5000")
        print("📡 Frontend will call: http://localhost:5000/predict")
        print("\nPress Ctrl+C to stop the server\n")
    except Exception as e:
        print(f"\n❌ Failed to load model: {e}")
        print("Please check that model.keras and class_mapping.json exist")
        exit(1)
    
    # Render sets PORT; fall back to 5000 for local dev
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

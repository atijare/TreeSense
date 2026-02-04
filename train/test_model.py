import tensorflow as tf
import numpy as np
import json
from tensorflow.keras.preprocessing import image

# ---- Load Model ----
model = tf.keras.models.load_model("model.keras")

# ---- Load class mapping from JSON ----
with open("class_mapping.json", "r") as f:
    class_map = json.load(f)

# Convert key strings ("0","1",...) to sorted list of class names
class_names = [class_map[str(i)] for i in range(len(class_map))]

print("Loaded class names:", class_names)

# ---- Path to test image ----
img_path = "test_images/test_image.jpg"   # update path if needed

# ---- Preprocess image ----
img = image.load_img(img_path, target_size=(160, 160))
img_array = image.img_to_array(img)
img_array = tf.expand_dims(img_array, 0)  # Add batch dimension
img_array = img_array / 255.0

# ---- Predict ----
pred = model.predict(img_array)
pred = pred[0]  # remove batch dimension

# ---- Top 3 predictions ----
top3_indices = pred.argsort()[-3:][::-1]   # sort desc
top3_conf = pred[top3_indices]

print("\n🔍 **Top 3 Predictions**")
for i, idx in enumerate(top3_indices):
    print(f"{i+1}. {class_names[idx]} — {top3_conf[i]*100:.2f}% confidence")

# Most likely prediction
best_idx = top3_indices[0]
print("\n🎯 Best Prediction:", class_names[best_idx])
print(f"Confidence: {top3_conf[0]*100:.2f}%")

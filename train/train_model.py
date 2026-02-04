import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
import json, os, matplotlib.pyplot as plt


# -----------------------------
# CONFIG
# -----------------------------
DATASET_DIR = "../dataset"
IMAGE_SIZE = (160, 160)
BATCH_SIZE = 16
EPOCHS = 30   # we let LR scheduler stop early


# -----------------------------
# CLASS NAMES
# -----------------------------
class_names = sorted([
    c for c in os.listdir(DATASET_DIR)
    if os.path.isdir(os.path.join(DATASET_DIR, c))
])
num_classes = len(class_names)

with open("class_mapping.json", "w") as f:
    json.dump({i: name for i, name in enumerate(class_names)}, f, indent=4)


# -----------------------------
# DATA GENERATORS
# -----------------------------
datagen = ImageDataGenerator(
    rescale=1/255.0,
    validation_split=0.30,
    zoom_range=0.10,
    horizontal_flip=True,
)

train_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training",
)

val_gen = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation",
)


# -----------------------------
# MODEL
# -----------------------------
base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(*IMAGE_SIZE, 3)
)

# Fine-tune LAST 30% of layers
for layer in base_model.layers[:100]:
    layer.trainable = False
for layer in base_model.layers[100:]:
    layer.trainable = True

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.4)(x)
output = Dense(num_classes, activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=output)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)


# -----------------------------
# CALLBACKS
# -----------------------------
checkpoint = ModelCheckpoint("model.keras", monitor="val_accuracy",
                             save_best_only=True, verbose=1)

early_stop = EarlyStopping(monitor="val_accuracy", patience=6,
                           restore_best_weights=True)

lr_reduce = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.3,
    patience=3,
    min_lr=1e-7,
    verbose=1
)


# -----------------------------
# TRAIN
# -----------------------------
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    callbacks=[checkpoint, early_stop, lr_reduce]
)


# -----------------------------
# PLOT
# -----------------------------
plt.figure(figsize=(10,5))
plt.plot(history.history["accuracy"], label="Train Acc")
plt.plot(history.history["val_accuracy"], label="Val Acc")
plt.legend()
plt.savefig("history_plot.png")
plt.close()

print("Training complete! Model saved as model.keras")

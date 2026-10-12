import os
import json
import argparse
import numpy as np
import cv2
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

def load_data(data_dir, img_width=30, img_height=30):
    """
    Load image data from data_dir.
    Assumes data_dir contains 43 class subfolders (0 through 42).
    """
    print(f"Loading GTSRB images from '{data_dir}'...")
    images, labels = [], []

    if not os.path.exists(data_dir):
        raise FileNotFoundError(f"Dataset path not found: {data_dir}")

    for foldername in os.listdir(data_dir):
        folder_path = os.path.join(data_dir, foldername)
        if not os.path.isdir(folder_path) or not foldername.isdigit():
            continue

        label = int(foldername)
        for filename in os.listdir(folder_path):
            img_path = os.path.join(folder_path, filename)
            img = cv2.imread(img_path)
            if img is None:
                continue

            img = cv2.resize(img, (img_width, img_height))
            img = np.array(img, dtype=np.float32) / 255.0

            images.append(img)
            labels.append(label)

    print(f"Loaded {len(images)} images across {len(set(labels))} classes.")
    return np.array(images, dtype=np.float32), np.array(labels)

def build_model(img_width=30, img_height=30, num_categories=43):
    """Construct CNN with data augmentation and regularization."""
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(img_width, img_height, 3)),
        # Data Augmentation layers
        tf.keras.layers.RandomRotation(0.08),
        tf.keras.layers.RandomZoom(0.08),
        tf.keras.layers.RandomTranslation(0.05, 0.05),

        # Conv Block 1
        tf.keras.layers.Conv2D(64, (3, 3), activation="relu", padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),

        # Conv Block 2
        tf.keras.layers.Conv2D(128, (3, 3), activation="relu", padding="same"),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),

        # Dense Classifier
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(512, activation="relu"),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_categories, activation="softmax")
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

def main():
    parser = argparse.ArgumentParser(description="Train GTSRB Traffic Sign Classifier Locally")
    parser.add_argument("--data_dir", type=str, default="dataset/gtsrb", help="Path to GTSRB dataset directory")
    parser.add_argument("--epochs", type=int, default=25, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory to save weights & metrics")
    parser.add_argument("--dry_run", action="store_true", help="Run 1 epoch with synthetic data to test pipeline")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    if args.dry_run or not os.path.exists(args.data_dir):
        print("Running in dry-run mode with synthetic data...")
        X = np.random.rand(100, 30, 30, 3).astype(np.float32)
        y = np.random.randint(0, 43, size=(100,))
    else:
        X, y = load_data(args.data_dir)

    # 60% Train, 20% Val, 20% Test
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.4, random_state=42, stratify=y)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp)

    print(f"Dataset split: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    model = build_model()
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=os.path.join(args.output_dir, "best_gtsrb_model.keras"),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1
        )
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks
    )

    # Evaluate on Test Split
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=1)
    print(f"Test Accuracy: {test_acc:.4f}, Test Loss: {test_loss:.4f}")

    # Predictions & Confusion Matrix
    y_pred_probs = model.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)

    cm = confusion_matrix(y_test, y_pred).tolist()
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Save metrics and history
    metrics = {
        "test_accuracy": float(test_acc),
        "test_loss": float(test_loss),
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "classification_report": report
    }

    with open(os.path.join(args.output_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    with open(os.path.join(args.output_dir, "confusion_matrix.json"), "w") as f:
        json.dump(cm, f, indent=2)

    # Convert history numpy types to float
    clean_history = {
        k: [float(v) for v in vals]
        for k, vals in history.history.items()
    }
    with open(os.path.join(args.output_dir, "history.json"), "w") as f:
        json.dump(clean_history, f, indent=2)

    # Final model export
    final_model_path = os.path.join(args.output_dir, "gtsrb_cnn_model.h5")
    model.save(final_model_path)
    print(f"Model and artifacts successfully saved to '{args.output_dir}'")

if __name__ == "__main__":
    main()

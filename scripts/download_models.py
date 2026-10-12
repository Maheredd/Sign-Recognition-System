import os
import sys

MODELS = {
    "Models/ISLmodel.h5": {
        "description": "Indian Sign Language (ISL) 42-landmark MLP classifier (35 classes)",
        "expected_size_mb": 11.5,
    },
    "Models/gtsrb_cnn_model.h5": {
        "description": "GTSRB Traffic Sign CNN classifier (43 classes)",
        "expected_size_mb": 11.0,
    },
    "Models/model.h5": {
        "description": "Legacy unoptimized GTSRB model checkpoint (retained for backward reproducibility)",
        "expected_size_mb": 29.5,
    }
}

def verify_or_download_models():
    os.makedirs("Models", exist_ok=True)
    all_ok = True

    print("Verifying AI Sign Recognition Model Assets...")
    for model_path, info in MODELS.items():
        if os.path.exists(model_path):
            size_mb = os.path.getsize(model_path) / (1024 * 1024)
            print(f"  [FOUND] {model_path} ({size_mb:.1f} MB) - {info['description']}")
        else:
            print(f"  [MISSING] {model_path} - {info['description']}")
            all_ok = False

    if all_ok:
        print("\nAll model assets verified and ready for deployment.")
    else:
        print("\nNote: Some models are missing. Pre-trained weights can be downloaded from the release repository.")

if __name__ == "__main__":
    verify_or_download_models()

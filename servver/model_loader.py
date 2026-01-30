import joblib
import os
import sys

# Define base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "trained_model")

MODEL_PATH = os.path.join(MODEL_DIR, "fertilizer_model.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "encoders.pkl")

# Load model and encoders
try:
    print(f"Loading model from {MODEL_PATH}...")
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

try:
    print(f"Loading encoders from {ENCODER_PATH}...")
    encoders = joblib.load(ENCODER_PATH)
    print("Encoders loaded successfully.")
    # Print classes for debugging
    # for key, enc in encoders.items():
    #     print(f"{key}: {enc.classes_}")
except Exception as e:
    print(f"Error loading encoders: {e}")
    encoders = None

# No scaler in the trained model based on analysis of train_model.py
scaler = None 

import sys
import os

# Ensure we can import from local directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("--- Starting Model Load Debug ---")
try:
    import model_loader
    print(f"Model Object: {model_loader.model}")
    print(f"Encoders Object: {model_loader.encoders}")
    
    if model_loader.model is None:
        print("❌ Model failed to load (is None).")
    else:
        print("✅ Model loaded successfully.")
        
except Exception as e:
    print(f"❌ Exception importing model_loader: {e}")

print("--- End Debug ---")

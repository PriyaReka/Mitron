import pandas as pd
import joblib

model = joblib.load("crop_model.pkl")
le = joblib.load("label_encoder.pkl")

sample = pd.DataFrame([{
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 26,
    "humidity": 80,
    "ph": 6.5,
    "rainfall": 120
}])

# Ensure correct column order
sample = sample[model.feature_names_in_]

pred = model.predict(sample)
crop = le.inverse_transform(pred)

print("Recommended Crop:", crop[0])

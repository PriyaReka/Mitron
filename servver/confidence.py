import numpy as np

def calculate_confidence(model, input_vector):
    """
    Calculate confidence score for the prediction.
    Range: 0 to 100
    """
    try:
        if hasattr(model, "predict_proba"):
            # Get probabilities for all classes
            probas = model.predict_proba([input_vector])
            # Get the maximum probability (confidence of the predicted class)
            confidence = np.max(probas)
        else:
            # Fallback for models that don't support probability estimates
            confidence = 0.85 
            
        return round(confidence * 100, 2)
    except Exception as e:
        print(f"Error calculating confidence: {e}")
        return 75.00

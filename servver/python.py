import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def train_fertilizer_model():
    print("Loading dataset...")
    try:
        df = pd.read_csv('fertilizer_recommendation.csv')
    except FileNotFoundError:
        print("Error: 'fertilizer_recommendation.csv' not found.")
        return

    print("Dataset loaded successfully.")
    print("Columns:", df.columns.tolist())

    # Define features and target
    # Based on the user's order and the file inspection
    # Target is 'Recommended_Fertilizer'
    target_col = 'Recommended_Fertilizer'
    
    if target_col not in df.columns:
        print(f"Error: Target column '{target_col}' not found in dataset.")
        return

    X = df.drop(columns=[target_col])
    y = df[target_col]

    # Preprocessing
    print("\nPreprocessing data...")
    le_dict = {}
    
    # Identify categorical columns
    categorical_cols = X.select_dtypes(include=['object']).columns
    print(f"Categorical columns found: {list(categorical_cols)}")

    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        le_dict[col] = le
    
    # Encode target variable as well
    le_target = LabelEncoder()
    y = le_target.fit_transform(y)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Model initialization and training
    print("\nTraining Random Forest model...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)

    # Predictions
    y_pred = rf_model.predict(X_test)

    # Evaluation
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    
    print("\nClassification Report:")
    # We need to map the classes back to original names for the report
    target_names = [str(cls) for cls in le_target.classes_]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Example Prediction
    print("-" * 30)
    print("Example Prediction:")
    # Take a sample from the test set
    sample_idx = 0
    sample_data = X_test.iloc[[sample_idx]]
    prediction_encoded = rf_model.predict(sample_data)[0]
    prediction_label = le_target.inverse_transform([prediction_encoded])[0]
    actual_label = le_target.inverse_transform([y_test[sample_idx]])[0]

    print(f"Predicted: {prediction_label}")
    print(f"Actual: {actual_label}")
    print("-" * 30)

    # Save the model and encoders
    print("Saving model and encoders...")
    model_data = {
        'model': rf_model,
        'encoders': le_dict,
        'target_encoder': le_target
    }
    joblib.dump(model_data, 'fertilizer_model.pkl')
    print("Model saved to 'fertilizer_model.pkl'")

if __name__ == "__main__":
    train_fertilizer_model()

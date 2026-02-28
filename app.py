
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import traceback
import os

# ==========================================
# STEP 2: Initialize Flask App
# ==========================================

app = Flask(__name__)

# Enable CORS so frontend (Next.js) can connect
CORS(app)


# ==========================================
# STEP 3: Load Trained Model
# ==========================================

try:
    # Use absolute path relative to this script so it works in Vercel's serverless env
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, "model.pkl")
    model = joblib.load(model_path)
    print("Model loaded successfully.")
except Exception as e:
    print("Error loading model:", e)
    model = None


# ==========================================
# STEP 4: Health Check Route
# ==========================================

@app.route("/", methods=["GET"])
def home():
    """
    Health check endpoint.
    Used to verify backend is running.
    """
    return jsonify({
        "status": "Backend is running successfully"
    })


# ==========================================
# STEP 5: Prediction Route
# ==========================================

@app.route("/predict", methods=["POST"])
def predict():
    """
    Receives JSON input from frontend,
    validates it,
    sends it to ML model,
    returns prediction result.
    """

    try:
        # Ensure model is loaded
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500

        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({"error": "No input data provided"}), 400

        # ==============================
        # Extract Required Features
        # ==============================
        # Feature names must match the CSV columns used for training (order matters!)
        feature_names = [
            "claim_number", "age_of_driver", "gender", "marital_status", "safety_rating",
            "annual_income", "high_education", "address_change", "property_status", "zip_code",
            "claim_date", "claim_day_of_week", "accident_site", "past_num_of_claims",
            "witness_present", "liab_prct", "channel", "police_report", "age_of_vehicle",
            "vehicle_category", "vehicle_price", "vehicle_color", "total_claim", "injury_claim",
            "policy deductible", "annual premium", "days open", "form defects"
        ]

        # Extract features in the correct order
        features = []
        missing_features = []
        
        for name in feature_names:
            value = data.get(name)
            if value is None:
                missing_features.append(name)
            else:
                try:
                    features.append(float(value))
                except ValueError:
                    return jsonify({"error": f"Invalid value for field: {name}"}), 400

        if missing_features:
            return jsonify({"error": f"Missing features: {', '.join(missing_features)}"}), 400

        # Create model input
        input_data = np.array([features])

        # ==============================
        # Make Prediction
        # ==============================

        prediction = model.predict(input_data)[0]

        # If classification model
        probability = None
        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(input_data)[0].max()

        # Convert numeric prediction to readable label
        # Assuming 0 = Not Fraud, 1 = Fraud based on typical datasets
        result = "Fraud" if prediction == 1 else "Not Fraud"

        # ==============================
        # Return Response
        # ==============================

        return jsonify({
            "prediction": result,
            "confidence": float(probability) if probability else None
        })

    except Exception as e:
        print("Error during prediction:")
        traceback.print_exc()

        return jsonify({
            "error": "Prediction failed",
            "details": str(e)
        }), 500


# ==========================================
# STEP 6: Run Server
# ==========================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True  # Turn OFF in production
    )

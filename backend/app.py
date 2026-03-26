import io
import pickle
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from flask import Flask, jsonify, request
from flask_cors import CORS

from function.transformers import ColumnSelector, FeatureEngineering, WoEEncoding


app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"
REQUIRED_FIELDS = ["Pregnancies", "Glucose", "Insulin", "BMI", "Age"]


def _load_model(model_path: Path):
    model_bytes = model_path.read_bytes()
    if model_bytes.startswith(b"\xef\xbb\xbf"):
        model_bytes = model_bytes[3:]

    model_stream = io.BytesIO(model_bytes)
    try:
        return joblib.load(model_stream)
    except Exception:
        model_stream.seek(0)
        return pickle.load(model_stream)


model = _load_model(MODEL_PATH)


def _to_float(payload: dict, key: str) -> float:
    value = payload.get(key)
    if value is None:
        raise ValueError(f"Missing required field: {key}")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Invalid numeric value for field: {key}") from exc


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a valid JSON object."}), 400

    try:
        input_row = {field: _to_float(payload, field) for field in REQUIRED_FIELDS}
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    input_df = pd.DataFrame([input_row], columns=REQUIRED_FIELDS)

    prediction = int(model.predict(input_df)[0])
    probability = float(model.predict_proba(input_df)[0][1])

    transformed = model.named_steps["feature_engineering"].transform(input_df)
    transformed = model.named_steps["woe_encoding"].transform(transformed)
    transformed = model.named_steps["column_selector"].transform(transformed)

    tree_model = model.named_steps["model"]
    explainer = shap.TreeExplainer(tree_model)
    shap_output = explainer.shap_values(transformed)

    if isinstance(shap_output, list):
        shap_array = np.asarray(shap_output[1])[0]
    else:
        shap_array = np.asarray(shap_output)
        if shap_array.ndim == 3:
            shap_array = shap_array[0, :, 1]
        elif shap_array.ndim == 2:
            shap_array = shap_array[0]
        else:
            shap_array = np.ravel(shap_array)

    shap_values = {
        feature: float(value)
        for feature, value in zip(transformed.columns.tolist(), shap_array.tolist())
    }

    return jsonify(
        {
            "prediction": prediction,
            "probability": probability,
            "shap_values": shap_values,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
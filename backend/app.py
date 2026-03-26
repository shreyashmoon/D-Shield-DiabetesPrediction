import io
import base64
import json
import os
import pickle
import re
from pathlib import Path

import google.generativeai as genai
import joblib
import numpy as np
import pandas as pd
import shap
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from function.transformers import ColumnSelector, FeatureEngineering, WoEEncoding


app = Flask(__name__)
CORS(app)

MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"
REQUIRED_FIELDS = ["Pregnancies", "Glucose", "Insulin", "BMI", "Age"]
FOOD_ANALYSIS_PROMPT = "Analyze this food image and return ONLY a JSON object with no extra text, no markdown, no backticks. Assume a conservative standard single serving portion size. Do not overestimate. The JSON must have: food_name (string), calories_min (number), calories_max (number — must not exceed calories_min by more than 150), sugar_min (number), sugar_max (number — must not exceed sugar_min by more than 5), carbs_min (number), carbs_max (number — must not exceed carbs_min by more than 40), protein_min (number), protein_max (number — must not exceed protein_min by more than 8), fat_min (number), fat_max (number — must not exceed fat_min by more than 10), diabetic_risk (string: Low / Medium / High), reason (string, one sentence)."
FOOD_ANALYSIS_FIELDS = [
    "food_name",
    "calories_min",
    "calories_max",
    "sugar_min",
    "sugar_max",
    "carbs_min",
    "carbs_max",
    "protein_min",
    "protein_max",
    "fat_min",
    "fat_max",
    "diabetic_risk",
    "reason",
]

load_dotenv(Path(__file__).resolve().parent / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PREFERRED_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash-preview",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
]


def _select_available_gemini_model_name() -> str | None:
    try:
        model_infos = list(genai.list_models())
    except Exception:
        return None

    supported_names = {
        info.name.replace("models/", "")
        for info in model_infos
        if "generateContent" in getattr(info, "supported_generation_methods", [])
    }

    for candidate in PREFERRED_GEMINI_MODELS:
        if candidate in supported_names:
            return candidate

    for model_name in sorted(supported_names):
        if "flash" in model_name.lower():
            return model_name

    return next(iter(sorted(supported_names)), None)

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    selected_model_name = _select_available_gemini_model_name() or "gemini-2.5-flash"
    gemini_model = genai.GenerativeModel(selected_model_name)
    generation_config = genai.types.GenerationConfig(temperature=0)
else:
    gemini_model = None
    generation_config = None


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


def _extract_json_from_text(response_text: str) -> dict:
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response_text, flags=re.DOTALL)
        if not match:
            raise ValueError("Gemini did not return a valid JSON object.")

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise ValueError("Gemini returned malformed JSON.") from exc


def _normalize_food_analysis(payload: dict) -> dict:
    missing_fields = [field for field in FOOD_ANALYSIS_FIELDS if field not in payload]
    if missing_fields:
        raise ValueError(f"Gemini response missing fields: {', '.join(missing_fields)}")

    return {
        "food_name": str(payload["food_name"]),
        "calories_min": float(payload["calories_min"]),
        "calories_max": float(payload["calories_max"]),
        "sugar_min": float(payload["sugar_min"]),
        "sugar_max": float(payload["sugar_max"]),
        "carbs_min": float(payload["carbs_min"]),
        "carbs_max": float(payload["carbs_max"]),
        "protein_min": float(payload["protein_min"]),
        "protein_max": float(payload["protein_max"]),
        "fat_min": float(payload["fat_min"]),
        "fat_max": float(payload["fat_max"]),
        "diabetic_risk": str(payload["diabetic_risk"]),
        "reason": str(payload["reason"]),
    }


def _parse_retry_seconds(error_text: str) -> int | None:
    match = re.search(r"Please retry in\s+(\d+(?:\.\d+)?)s", error_text, flags=re.IGNORECASE)
    if not match:
        return None
    try:
        return int(float(match.group(1)))
    except ValueError:
        return None


def _build_gemini_error_response(exc: Exception):
    error_text = str(exc)
    lowered = error_text.lower()

    if "429" in lowered or "quota" in lowered or "rate limit" in lowered:
        retry_after = _parse_retry_seconds(error_text)
        message = (
            "Gemini quota/rate limit reached. Please check Gemini API billing/quota settings and try again shortly."
        )
        payload = {
            "error": message,
            "code": "GEMINI_QUOTA_EXCEEDED",
        }
        if retry_after is not None:
            payload["retry_after_seconds"] = retry_after
        return jsonify(payload), 429

    return jsonify({"error": f"Food analysis failed: {error_text}"}), 500


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


@app.post("/analyze-food")
def analyze_food():
    if gemini_model is None:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    image_file = request.files.get("image") or request.files.get("file")
    if image_file is None and request.files:
        image_file = next(iter(request.files.values()))

    if image_file is None or not image_file.filename:
        return jsonify({"error": "Food image file is required."}), 400

    try:
        image_bytes = image_file.read()
        if not image_bytes:
            return jsonify({"error": "Uploaded image file is empty."}), 400

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = image_file.mimetype or "image/jpeg"

        try:
            response = gemini_model.generate_content(
                [
                    {"text": FOOD_ANALYSIS_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": image_b64,
                        }
                    },
                ],
                generation_config=generation_config,
            )
        except Exception as exc:
            error_message = str(exc)
            if "not found" in error_message.lower() or "not supported" in error_message.lower():
                fallback_model_name = _select_available_gemini_model_name()
                if fallback_model_name:
                    fallback_model = genai.GenerativeModel(fallback_model_name)
                    response = fallback_model.generate_content(
                        [
                            {"text": FOOD_ANALYSIS_PROMPT},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": image_b64,
                                }
                            },
                        ],
                        generation_config=generation_config,
                    )
                else:
                    raise ValueError(
                        "No Gemini model with generateContent is available for this API key."
                    )
            else:
                raise

        response_text = (response.text or "").strip()
        if not response_text:
            raise ValueError("Gemini returned an empty response.")

        parsed = _extract_json_from_text(response_text)
        normalized = _normalize_food_analysis(parsed)
        return jsonify(normalized)
    except ValueError as exc:
        return jsonify({"error": f"Failed to parse Gemini response: {str(exc)}"}), 502
    except Exception as exc:
        return _build_gemini_error_response(exc)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
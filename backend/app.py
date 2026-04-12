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
CORS(app, origins=[
    "http://localhost:5173",
    "https://dshield.vercel.app",
    "https://*.vercel.app"
])

MODEL_PATH = Path(__file__).resolve().parent / "new_model.pkl"
REQUIRED_FIELDS = ["Pregnancies", "Glucose", "Insulin", "BMI", "Age"]
REQUIRED_FIELDS_V2 = ["Pregnancies", "Glucose", "BloodPressure", "Insulin", "BMI", "Age"]
FOOD_ANALYSIS_PROMPT = "Analyze this food image and return ONLY a JSON object with no extra text, no markdown, no backticks. Assume a conservative standard single serving portion size. Do not overestimate. The JSON must have: food_name (string), calories_min (number), calories_max (number — must not exceed calories_min by more than 150), sugar_min (number), sugar_max (number — must not exceed sugar_min by more than 5), carbs_min (number), carbs_max (number — must not exceed carbs_min by more than 40), protein_min (number), protein_max (number — must not exceed protein_min by more than 8), fat_min (number), fat_max (number — must not exceed fat_min by more than 10), diabetic_risk (string: Low / Medium / High), reason (string, one sentence)."
FOOD_TEXT_ANALYSIS_PROMPT = "A user described their food as: '{food_description}'. Analyze this food description and return ONLY a JSON object with no extra text, no markdown, no backticks. Assume a conservative standard single serving portion size. Do not overestimate. The JSON must have: food_name (string), calories_min (number), calories_max (number — must not exceed calories_min by more than 150), sugar_min (number), sugar_max (number — must not exceed sugar_min by more than 5), carbs_min (number), carbs_max (number — must not exceed carbs_min by more than 40), protein_min (number), protein_max (number — must not exceed protein_min by more than 8), fat_min (number), fat_max (number — must not exceed fat_min by more than 10), diabetic_risk (string: Low / Medium / High), reason (string, one sentence)."
RECOMMENDATION_PROMPT = "A patient has the following health values: Pregnancies: {p}, Glucose: {g}, Insulin: {i}, BMI: {b}, Age: {a}. The diabetes risk prediction model gave them a result of {result} with {probability}% probability. Give personalized health recommendations in JSON format with these fields: diet_tips (array of 4 strings), exercise_tips (array of 3 strings), habits_to_avoid (array of 3 strings), positive_habits (array of 3 strings), summary (one paragraph personalized summary). Be specific to their values, not generic."
RECOMMENDATION_FIELDS = [
    "diet_tips",
    "exercise_tips",
    "habits_to_avoid",
    "positive_habits",
    "summary",
]
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
MODEL_MAP = {
    "Gemini 2.5 Flash": "gemini-2.5-flash",
    "Gemini 2.5 Flash Lite": "gemini-2.5-flash-lite-preview-06-17",
    "Gemini 2.5 Pro": "gemini-2.5-pro",
    "Gemini 2 Flash": "gemini-2.0-flash",
    "Gemini 2 Flash Lite": "gemini-2.0-flash-lite",
    "Gemini 3 Flash": "gemini-2.5-flash",
    "Gemini 3.1 Flash Lite": "gemini-2.5-flash-lite-preview-06-17",
    "Gemini 3.1 Pro": "gemini-2.5-pro",
}

load_dotenv(Path(__file__).resolve().parent / ".env")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    generation_config = genai.types.GenerationConfig(temperature=0)
else:
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


model = _load_model(MODEL_PATH) if MODEL_PATH.exists() else None


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


def _normalize_recommendations(payload: dict) -> dict:
    missing_fields = [field for field in RECOMMENDATION_FIELDS if field not in payload]
    if missing_fields:
        raise ValueError(f"Gemini response missing fields: {', '.join(missing_fields)}")

    def _normalize_string_list(value, field_name: str) -> list[str]:
        if not isinstance(value, list):
            raise ValueError(f"Gemini response field must be an array: {field_name}")

        normalized_items = [str(item).strip() for item in value if str(item).strip()]
        if len(normalized_items) != len(value):
            raise ValueError(f"Gemini response field contains empty items: {field_name}")

        return normalized_items

    return {
        "diet_tips": _normalize_string_list(payload["diet_tips"], "diet_tips"),
        "exercise_tips": _normalize_string_list(payload["exercise_tips"], "exercise_tips"),
        "habits_to_avoid": _normalize_string_list(payload["habits_to_avoid"], "habits_to_avoid"),
        "positive_habits": _normalize_string_list(payload["positive_habits"], "positive_habits"),
        "summary": str(payload["summary"]).strip(),
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


def _resolve_model_name(gemini_model: str | None) -> str:
    return MODEL_MAP.get(gemini_model, "gemini-2.0-flash")


def _generate_gemini_content(prompt: str, gemini_model: str | None = None):
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key is not configured on the server.")

    resolved_model_name = _resolve_model_name(gemini_model)
    model_client = genai.GenerativeModel(resolved_model_name)

    try:
        return model_client.generate_content(prompt, generation_config=generation_config)
    except Exception:
        raise


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


@app.post("/predict-v2")
def predict_v2():
    if model is None:
        return jsonify({"error": "new_model.pkl not found. Train the model first."}), 503

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a valid JSON object."}), 400

    try:
        input_row = {field: _to_float(payload, field) for field in REQUIRED_FIELDS_V2}
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    try:
        input_df = pd.DataFrame([input_row], columns=REQUIRED_FIELDS_V2)

        prediction = int(model.predict(input_df)[0])
        probability = float(model.predict_proba(input_df)[0][1])

        explainer = shap.TreeExplainer(model)
        shap_output = explainer.shap_values(input_df)

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
            for feature, value in zip(input_df.columns.tolist(), shap_array.tolist())
        }

        return jsonify(
            {
                "prediction": prediction,
                "probability": probability,
                "shap_values": shap_values,
            }
        )
    except Exception as exc:
        return jsonify({"error": f"Prediction v2 failed: {str(exc)}"}), 500


@app.post("/analyze-food")
def analyze_food():
    if not GEMINI_API_KEY:
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

        selected_gemini_model = request.form.get("gemini_model")
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = image_file.mimetype or "image/jpeg"
        resolved_model_name = _resolve_model_name(selected_gemini_model)
        model_client = genai.GenerativeModel(resolved_model_name)

        try:
            response = model_client.generate_content(
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
        except Exception:
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


@app.post("/analyze-text")
@app.post("/analyze-food-text")
def analyze_food_text():
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    data = request.get_json() or {}
    food_description = data.get("food_description", "").strip()
    selected_gemini_model = data.get("gemini_model")

    if not food_description:
        return jsonify({"error": "Food description is required."}), 400

    try:
        prompt = FOOD_TEXT_ANALYSIS_PROMPT.format(food_description=food_description)
        response = _generate_gemini_content(prompt, selected_gemini_model)

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


@app.post("/recommend")
def recommend():
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a valid JSON object."}), 400

    try:
        pregnancies = _to_float(payload, "Pregnancies")
        glucose = _to_float(payload, "Glucose")
        insulin = _to_float(payload, "Insulin")
        bmi = _to_float(payload, "BMI")
        age = _to_float(payload, "Age")
        selected_gemini_model = payload.get("gemini_model")
        result_value = str(payload.get("result", "")).strip()
        probability_value = str(payload.get("probability", "")).strip()

        if not result_value:
            raise ValueError("Missing required field: result")
        if not probability_value:
            raise ValueError("Missing required field: probability")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    try:
        prompt = RECOMMENDATION_PROMPT.format(
            p=pregnancies,
            g=glucose,
            i=insulin,
            b=bmi,
            a=age,
            result=result_value,
            probability=probability_value,
        )

        response = _generate_gemini_content(prompt, selected_gemini_model)
        response_text = (response.text or "").strip()
        if not response_text:
            raise ValueError("Gemini returned an empty response.")

        parsed = _extract_json_from_text(response_text)
        normalized = _normalize_recommendations(parsed)
        return jsonify(normalized)
    except ValueError as exc:
        return jsonify({"error": f"Failed to parse Gemini response: {str(exc)}"}), 502
    except Exception as exc:
        return _build_gemini_error_response(exc)


@app.post("/translate-recommendation")
def translate_recommendation():
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key is not configured on the server."}), 500

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a valid JSON object."}), 400

    recommendation = data.get("recommendation")
    language = data.get("language", "").strip()
    selected_gemini_model = data.get("gemini_model")

    if not recommendation:
        return jsonify({"error": "Recommendation object is required."}), 400
    if language not in ["Hindi", "Marathi"]:
        return jsonify({"error": "Language must be either 'Hindi' or 'Marathi'."}), 400

    try:
        recommendation_json = json.dumps(recommendation)
        prompt = (
            f"Translate the following health recommendation JSON into {language}. "
            f"Return ONLY the translated JSON object with exactly the same structure and field names in English, "
            f"but all string values translated to {language}. Keep medical terms accurate. "
            f"JSON to translate: {recommendation_json}"
        )

        response = _generate_gemini_content(prompt, selected_gemini_model)
        response_text = (response.text or "").strip()

        if not response_text:
            raise ValueError("Gemini returned an empty response.")

        parsed = _extract_json_from_text(response_text)

        missing_fields = [field for field in RECOMMENDATION_FIELDS if field not in parsed]
        if missing_fields:
            raise ValueError(f"Translated response missing fields: {', '.join(missing_fields)}")

        return jsonify(parsed)
    except ValueError as exc:
        return jsonify({"error": str(exc), "fallback": recommendation}), 502
    except Exception as exc:
        return jsonify({"error": f"Translation failed: {str(exc)}", "fallback": recommendation}), 500


if __name__ == "__main__":
    app.run(debug=False, port=5000)

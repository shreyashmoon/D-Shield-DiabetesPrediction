import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split


FEATURES = ["Pregnancies", "Glucose", "BloodPressure", "Insulin", "BMI", "Age"]
TARGET = "Outcome"
ZERO_TO_MEDIAN_COLUMNS = ["Glucose", "BloodPressure", "Insulin", "BMI"]


def main() -> None:
    backend_dir = Path(__file__).resolve().parent
    dataset_path = backend_dir.parent / "datasets" / "diabetes.csv"
    model_path = backend_dir / "new_model.pkl"

    df = pd.read_csv(dataset_path)

    for col in ZERO_TO_MEDIAN_COLUMNS:
        median_value = df.loc[df[col] != 0, col].median()
        df[col] = df[col].replace(0, median_value)

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall: {recall_score(y_test, y_pred):.4f}")
    print(f"F1 Score: {f1_score(y_test, y_pred):.4f}")
    print(f"ROC AUC: {roc_auc_score(y_test, y_proba):.4f}")

    with model_path.open("wb") as f:
        pickle.dump(model, f)

    print(f"Model saved to: {model_path}")


if __name__ == "__main__":
    main()
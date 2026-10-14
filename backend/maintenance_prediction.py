"""
================================================================================
AquaMind AI - Module 2: Pump Predictive Maintenance System
================================================================================
Demonstrates the following AI Syllabus Topics:
  1. [AI SYLLABUS: MACHINE LEARNING]
     - Supervised learning with RandomForestClassifier / DecisionTree
     - Trained on in-memory synthetic sensory dataset
     - Multi-class classification: Low, Medium, High failure risk
  2. [AI SYLLABUS: PROBABILISTIC / BAYESIAN REASONING]
     - Prior belief distribution P(Risk)
     - Likelihood estimation from multi-sensor evidence P(Evidence | Risk)
     - Bayesian posterior risk computation and probabilistic fusion
  3. [AI SYLLABUS: KNOWLEDGE REPRESENTATION & RULE-BASED INFERENCE]
     - Expert System with forward-chaining IF-THEN production rules
     - Combines sensory thresholds with operational safety directives
================================================================================
"""

from typing import Dict, Any, List
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier

router = APIRouter(prefix="/api", tags=["Pump Maintenance"])

CLASS_LABELS = {0: "Low", 1: "Medium", 2: "High"}


# ==============================================================================
# Pydantic Schemas
# ==============================================================================
class PumpSensors(BaseModel):
    motor_temperature: float = Field(..., ge=0, le=200, description="Motor surface temperature in °C")
    vibration: float = Field(..., ge=0, le=50, description="Vibration velocity in mm/s")
    running_hours: float = Field(..., ge=0, description="Cumulative pump operational hours")
    water_pressure: float = Field(..., ge=0, le=300, description="Pipeline discharge pressure in PSI")
    previous_failures: int = Field(..., ge=0, description="Number of past recorded breakdowns")


# ==============================================================================
# [AI SYLLABUS: MACHINE LEARNING]
# Synthetic Dataset Generation & Model Training
# ==============================================================================
def generate_synthetic_dataset(n_samples: int = 800):
    """
    Synthesizes realistic operational data representing healthy, degrading,
    and critical water pump conditions.
    """
    rng = np.random.default_rng(42)

    temp = rng.uniform(40, 115, n_samples)          # Healthy: 50-70°C, Hot: >80°C
    vib = rng.uniform(0.5, 12, n_samples)           # Healthy: 1-3 mm/s, High: >7 mm/s
    hours = rng.uniform(0, 10000, n_samples)        # Healthy: <3000, Worn: >6000
    pressure = rng.uniform(15, 95, n_samples)       # Healthy: 40-70 PSI
    failures = rng.integers(0, 7, n_samples)

    # Physical stress scores
    temp_stress = np.clip((temp - 65) / 35, 0, 1) * 3.0
    vib_stress = np.clip((vib - 2.5) / 7.5, 0, 1) * 3.0
    hours_stress = np.clip((hours - 3000) / 7000, 0, 1) * 2.0
    pressure_dev = np.maximum(0, np.maximum(40 - pressure, pressure - 75))
    pressure_stress = np.clip(pressure_dev / 25, 0, 1) * 1.5
    failure_stress = np.minimum(failures, 4) / 4 * 2.0

    total_risk = (
        temp_stress + vib_stress + hours_stress +
        pressure_stress + failure_stress + rng.normal(0, 0.35, n_samples)
    )

    # Map continuous stress to categories: Low (0), Medium (1), High (2)
    y = np.where(total_risk < 3.4, 0, np.where(total_risk < 6.2, 1, 2))
    X = np.column_stack([temp, vib, hours, pressure, failures])
    return X, y


def train_ml_model() -> RandomForestClassifier:
    """Trains a Random Forest classifier in memory upon system initialization."""
    X, y = generate_synthetic_dataset(800)
    clf = RandomForestClassifier(n_estimators=75, max_depth=6, random_state=42)
    clf.fit(X, y)
    return clf


# Trained once in-memory during application lifecycle
PUMP_MODEL = train_ml_model()


# ==============================================================================
# [AI SYLLABUS: PROBABILISTIC / BAYESIAN REASONING]
# ==============================================================================
def bayesian_risk_assessment(
    temp: float, vib: float, hours: float, pressure: float, failures: int
) -> Dict[str, Any]:
    """
    Applies Bayesian-style probabilistic reasoning.
    Priors: P(High)=0.15, P(Medium)=0.35, P(Low)=0.50.
    Updates belief using sensory likelihood indicators P(Evidence | State).
    """
    # 1. Prior Belief Distribution
    priors = {"Low": 0.50, "Medium": 0.35, "High": 0.15}

    # 2. Likelihood Evidence Calculations based on physical domain heuristics
    # Temperature stress factor
    t_factor = np.clip((temp - 50) / 45, 0.05, 0.95)
    # Vibration stress factor
    v_factor = np.clip((vib - 1.5) / 8.5, 0.05, 0.95)
    # Hours stress factor
    h_factor = np.clip(hours / 9000, 0.05, 0.95)
    # Pressure anomaly factor
    p_dev = max(0.0, 40 - pressure) + max(0.0, pressure - 75)
    p_factor = np.clip(p_dev / 30, 0.05, 0.95)
    # Failure history factor
    f_factor = np.clip(failures / 4.0, 0.05, 0.95)

    composite_stress = (
        0.30 * t_factor + 0.30 * v_factor + 0.15 * h_factor +
        0.15 * p_factor + 0.10 * f_factor
    )

    # Likelihood of observing composite stress given failure risk state
    # Under 'High' state, high stress is expected; under 'Low' state, low stress is expected.
    likelihoods = {
        "Low": max(0.01, 1.0 - composite_stress),
        "Medium": max(0.01, 1.0 - abs(composite_stress - 0.5) * 1.8),
        "High": max(0.01, composite_stress),
    }

    # 3. Bayes Theorem Posterior Calculation: P(Risk | Evidence) = P(Evidence | Risk) * P(Risk) / Evidence
    unnormalized = {state: priors[state] * likelihoods[state] for state in priors}
    total_evidence = sum(unnormalized.values())
    posteriors = {state: round((val / total_evidence) * 100, 1) for state, val in unnormalized.items()}

    # Probabilistic composite risk index (0 to 100 scale)
    bayesian_score = round(posteriors["High"] * 1.0 + posteriors["Medium"] * 0.5, 1)

    return {
        "prior_distribution": priors,
        "evidence_stress_index": round(float(composite_stress), 3),
        "posterior_probabilities": posteriors,
        "bayesian_risk_score": bayesian_score,
    }


# ==============================================================================
# [AI SYLLABUS: KNOWLEDGE REPRESENTATION & RULE-BASED INFERENCE]
# ==============================================================================
def rule_based_inference(
    temp: float, vib: float, hours: float, pressure: float, failures: int, ml_risk: str
) -> Dict[str, Any]:
    """
    Expert System Inference Engine using forward-chaining IF-THEN production rules.
    """
    fired_rules: List[Dict[str, str]] = []

    # Rule 1: Thermal & Mechanical overload
    if temp > 80.0 and vib > 7.0:
        fired_rules.append({
            "rule": "IF temp > 80°C AND vibration > 7 mm/s",
            "action": "Immediate Maintenance Required (Severe Mechanical & Thermal Distress)",
            "severity": "High"
        })

    # Rule 2: Low pressure with prolonged wear (hydraulic cavity / worn impeller)
    if pressure < 25.0 and hours > 500.0:
        fired_rules.append({
            "rule": "IF pressure < 25 PSI AND running_hours > 500 hrs",
            "action": "Schedule Hydraulic & Seal Inspection (Risk of Cavitation/Dry Run)",
            "severity": "Medium"
        })

    # Rule 3: High recurrent failure threshold
    if failures >= 3 and temp > 75.0:
        fired_rules.append({
            "rule": "IF previous_failures >= 3 AND temp > 75°C",
            "action": "Critical Diagnostic: High Chronic Breakdown Likelihood",
            "severity": "High"
        })

    # Rule 4: High risk operational directive
    if ml_risk == "High":
        fired_rules.append({
            "rule": "IF risk == High",
            "action": "Stop pump immediately and dispatch utility technician",
            "severity": "High"
        })
    elif ml_risk == "Medium":
        fired_rules.append({
            "rule": "IF risk == Medium",
            "action": "Schedule on-site preventive inspection within 24 hours",
            "severity": "Medium"
        })
    else:
        fired_rules.append({
            "rule": "IF risk == Low",
            "action": "Normal operation. Sensor telemetry within nominal thresholds",
            "severity": "Low"
        })

    # Derive primary rule-based recommendation
    severities = [r["severity"] for r in fired_rules]
    primary_severity = "High" if "High" in severities else ("Medium" if "Medium" in severities else "Low")
    rule_directive = next((r["action"] for r in fired_rules if r["severity"] == primary_severity), "Normal operation")

    return {
        "rules_fired": fired_rules,
        "rule_severity": primary_severity,
        "rule_directive": rule_directive,
    }


# ==============================================================================
# Unified Predictive Maintenance Evaluator
# ==============================================================================
def predict_pump_risk(
    motor_temperature: float,
    vibration: float,
    running_hours: float,
    water_pressure: float,
    previous_failures: int
) -> Dict[str, Any]:
    """
    Fuses Machine Learning, Bayesian Probabilities, and Expert Rules into a consensus verdict.
    """
    # 1. Machine Learning Inference
    features = np.array([[motor_temperature, vibration, running_hours, water_pressure, previous_failures]])
    probs = PUMP_MODEL.predict_proba(features)[0]

    ml_probs = {"Low": 0.0, "Medium": 0.0, "High": 0.0}
    for class_id, p in zip(PUMP_MODEL.classes_, probs):
        ml_probs[CLASS_LABELS[int(class_id)]] = round(float(p) * 100, 1)

    ml_risk = max(ml_probs, key=ml_probs.get)
    ml_confidence = ml_probs[ml_risk]

    # 2. Bayesian Probabilistic Reasoning
    bayesian_data = bayesian_risk_assessment(
        motor_temperature, vibration, running_hours, water_pressure, previous_failures
    )

    # 3. Rule-Based Expert System Inference
    rules_data = rule_based_inference(
        motor_temperature, vibration, running_hours, water_pressure, previous_failures, ml_risk
    )

    # 4. Consensus Decision Fusion
    # If explicit critical safety rules fire, override to High
    if rules_data["rule_severity"] == "High" or (ml_risk == "High" and bayesian_data["bayesian_risk_score"] > 45):
        final_risk = "High"
        final_action = "STOP PUMP: Immediate technician intervention required."
    elif rules_data["rule_severity"] == "Medium" or ml_risk == "Medium" or bayesian_data["bayesian_risk_score"] > 30:
        final_risk = "Medium"
        final_action = "SCHEDULE INSPECTION: Pump shows degradation symptoms within 24h."
    else:
        final_risk = "Low"
        final_action = "NORMAL OPERATION: Pump running within safe operating parameters."

    # Pump health index (0 to 100 scale: 100 = Brand New, 0 = Catastrophic Failure)
    health_score = max(0, min(100, round(
        (ml_probs["Low"] * 0.6 + (100 - bayesian_data["bayesian_risk_score"]) * 0.4)
    )))

    return {
        "risk": final_risk,
        "health_score": health_score,
        "action": final_action,
        "machine_learning": {
            "predicted_class": ml_risk,
            "confidence_percent": ml_confidence,
            "probabilities": ml_probs,
            "model_type": "RandomForestClassifier (Synthetic Telemetry, n=75)",
        },
        "bayesian_reasoning": bayesian_data,
        "rule_based_inference": rules_data,
        "sensor_inputs": {
            "motor_temperature": motor_temperature,
            "vibration": vibration,
            "running_hours": running_hours,
            "water_pressure": water_pressure,
            "previous_failures": previous_failures,
        }
    }


# ==============================================================================
# API Endpoint
# ==============================================================================
@router.post("/predict-maintenance")
def predict_maintenance_api(sensors: PumpSensors):
    result = predict_pump_risk(**sensors.model_dump())

    # Sync state with in-memory dashboard
    from dashboard_data import STATE
    STATE["sensors"] = sensors.model_dump()

    return result

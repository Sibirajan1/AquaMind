"""
================================================================================
AquaMind AI - Module 3: Dashboard, Alerts & Multi-Agent Adversarial Simulation
================================================================================
Demonstrates the following AI Syllabus Topics:
  1. [AI SYLLABUS: INTELLIGENT ALERTS & KNOWLEDGE SYNTHESIS]
     - Multi-severity alert generation (Low, Medium, High)
     - Monitors critical CSP thresholds and predictive pump anomalies
  2. [AI SYLLABUS: MULTI-AGENT & ADVERSARIAL SIMULATION]
     - "Demand Agent": Adversarial water consumer that perturbs demand dynamics
     - "Fault Agent": Adversarial environment agent that induces hardware stress
     - System demonstrates dynamic adaptability & constraint resilience
================================================================================
"""

import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from water_allocation import allocate_water
from maintenance_prediction import predict_pump_risk

router = APIRouter(prefix="/api", tags=["Dashboard & Simulation"])

TANK_PHYSICAL_CAPACITY = 10000.0  # Physical size of hostel main overhead reservoir

# ==============================================================================
# In-Memory State & Baseline Configuration
# ==============================================================================
DEFAULT_BLOCKS = [
    {"name": "Block A", "demand": 3000.0, "priority": "High",   "min_required": 1500.0},
    {"name": "Block B", "demand": 4000.0, "priority": "Medium", "min_required": 1000.0},
    {"name": "Block C", "demand": 3500.0, "priority": "Low",    "min_required": 800.0},
    {"name": "Mess",    "demand": 2000.0, "priority": "High",   "min_required": 1200.0},
]

DEFAULT_SENSORS = {
    "motor_temperature": 68.0,
    "vibration": 2.4,
    "running_hours": 3200.0,
    "water_pressure": 52.0,
    "previous_failures": 1,
}

STATE: Dict[str, Any] = {
    "tank_capacity": 9000.0,
    "blocks": [b.copy() for b in DEFAULT_BLOCKS],
    "sensors": DEFAULT_SENSORS.copy(),
    "simulation_logs": [
        {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "agent": "System Orchestrator",
            "message": "AquaMind AI initialized. Intelligent multi-agent baseline active.",
        }
    ],
}


class SimulationRequest(BaseModel):
    event_type: Optional[str] = "random"  # 'demand_spike', 'pump_fault', 'reset', or 'random'


# ==============================================================================
# [AI SYLLABUS: INTELLIGENT ALERTS GENERATOR]
# ==============================================================================
def generate_alerts(allocation_result: Dict[str, Any], pump_result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Synthesizes alerts across water allocation CSP constraints and pump telemetry.
    """
    alerts: List[Dict[str, Any]] = []
    ts = datetime.now().strftime("%H:%M:%S")

    # 1. Water Allocation CSP Alerts
    for block in allocation_result.get("allocations", []):
        if not block["min_required_met"]:
            alerts.append({
                "id": f"water-crit-{block['name']}-{ts}",
                "type": "water",
                "severity": "High",
                "title": f"🚨 Critical Water Shortage: {block['name']}",
                "message": (
                    f"{block['name']} ({block['priority']} Priority) is below its essential minimum of "
                    f"{block['min_required']} L (Allocated: {block['allocated']} L, Shortage: {block['shortage']} L)."
                ),
                "timestamp": ts,
            })
        elif block["shortage"] > 0:
            severity = "Medium" if block["priority"] == "High" else "Low"
            alerts.append({
                "id": f"water-warn-{block['name']}-{ts}",
                "type": "water",
                "severity": severity,
                "title": f"⚠️ Water Deficit: {block['name']}",
                "message": (
                    f"{block['name']} has an unfulfilled demand shortage of {block['shortage']} L "
                    f"({block['fulfilment_percent']}% fulfilled)."
                ),
                "timestamp": ts,
            })

    # 2. Predictive Maintenance Anomaly Alerts
    risk = pump_result.get("risk", "Low")
    if risk == "High":
        alerts.append({
            "id": f"pump-high-{ts}",
            "type": "pump",
            "severity": "High",
            "title": "🚨 Pump Failure Risk: HIGH",
            "message": (
                f"Immediate maintenance required! {pump_result.get('action')}. "
                f"Sensors: Temp={pump_result['sensor_inputs']['motor_temperature']}°C, "
                f"Vib={pump_result['sensor_inputs']['vibration']} mm/s."
            ),
            "timestamp": ts,
        })
    elif risk == "Medium":
        alerts.append({
            "id": f"pump-med-{ts}",
            "type": "pump",
            "severity": "Medium",
            "title": "⚠️ Pump Degradation: MEDIUM RISK",
            "message": (
                f"Predictive model flagged equipment wear. {pump_result.get('action')}. "
                f"Bayesian risk score: {pump_result['bayesian_reasoning']['bayesian_risk_score']}%."
            ),
            "timestamp": ts,
        })
    else:
        alerts.append({
            "id": f"pump-info-{ts}",
            "type": "pump",
            "severity": "Low",
            "title": "✅ Pump Health Nominal",
            "message": "Telemetry within operating thresholds. Normal continuous pumping authorized.",
            "timestamp": ts,
        })

    return alerts


def build_full_system_snapshot() -> Dict[str, Any]:
    """Recomputes CSP allocation, pump ML/Bayesian prediction, and alerts."""
    allocation = allocate_water(STATE["tank_capacity"], STATE["blocks"])
    pump = predict_pump_risk(**STATE["sensors"])
    alerts = generate_alerts(allocation, pump)

    tank_size = max(TANK_PHYSICAL_CAPACITY, STATE["tank_capacity"])
    tank_level_pct = round((STATE["tank_capacity"] / tank_size) * 100, 1)

    return {
        "tank": {
            "available_liters": STATE["tank_capacity"],
            "tank_size_liters": tank_size,
            "level_percent": tank_level_pct,
        },
        "allocation": allocation,
        "pump": pump,
        "alerts": alerts,
        "alert_count": sum(1 for a in alerts if a["severity"] in ("High", "Medium")),
        "simulation_logs": STATE.get("simulation_logs", []),
    }


# ==============================================================================
# [AI SYLLABUS: MULTI-AGENT / ADVERSARIAL SIMULATION]
# ==============================================================================
class AdversarialDemandAgent:
    """
    Adversarial Agent simulating unexpected spikes in water demand
    (e.g., sudden hostel banquet, sports day, or pipeline leak).
    """
    @staticmethod
    def inject_perturbation(blocks: List[Dict[str, Any]]) -> str:
        target = random.choice(blocks)
        spike = random.choice([800.0, 1500.0, 2200.0])
        old_demand = target["demand"]
        target["demand"] = round(target["demand"] + spike, 2)
        return (
            f"Adversarial Demand Agent triggered: Injected +{spike:,.0f} L demand spike on "
            f"'{target['name']}' ({target['priority']} Priority). Demand jumped from {old_demand} L to {target['demand']} L."
        )


class AdversarialFaultAgent:
    """
    Adversarial Hardware Agent simulating mechanical and thermal failure events
    (e.g., bearing seizure, coolant loss, impeller cavitation).
    """
    @staticmethod
    def inject_perturbation(sensors: Dict[str, Any]) -> str:
        fault_scenario = random.choice(["thermal_runaway", "bearing_vibration", "cavitation_pressure"])

        if fault_scenario == "thermal_runaway":
            sensors["motor_temperature"] = round(random.uniform(88.0, 108.0), 1)
            sensors["vibration"] = round(random.uniform(5.5, 8.5), 1)
            return (
                f"Adversarial Fault Agent triggered: Thermal overload induced! Motor temperature escalated "
                f"to {sensors['motor_temperature']}°C with vibration at {sensors['vibration']} mm/s."
            )
        elif fault_scenario == "bearing_vibration":
            sensors["vibration"] = round(random.uniform(8.0, 14.0), 1)
            sensors["previous_failures"] += 1
            return (
                f"Adversarial Fault Agent triggered: Bearing imbalance fault! Mechanical vibration surged "
                f"to {sensors['vibration']} mm/s (Chronic breakdown count: {sensors['previous_failures']})."
            )
        else:
            sensors["water_pressure"] = round(random.uniform(12.0, 22.0), 1)
            sensors["running_hours"] = round(sensors["running_hours"] + 2500, 1)
            return (
                f"Adversarial Fault Agent triggered: Hydraulic cavitation induced! Pipeline pressure dropped "
                f"to {sensors['water_pressure']} PSI under high cumulative wear ({sensors['running_hours']} hrs)."
            )


# ==============================================================================
# API Endpoints
# ==============================================================================
@router.get("/dashboard")
def get_dashboard():
    return build_full_system_snapshot()


@router.get("/alerts")
def get_alerts():
    snapshot = build_full_system_snapshot()
    return {
        "alerts": snapshot["alerts"],
        "alert_count": snapshot["alert_count"],
        "water_alerts": [a for a in snapshot["alerts"] if a["type"] == "water"],
        "pump_alerts": [a for a in snapshot["alerts"] if a["type"] == "pump"],
    }


@router.post("/simulate-event")
def simulate_event(req: SimulationRequest):
    """
    Executes a multi-agent adversarial simulation step.
    Perturbs state and evaluates the adaptive response of CSP and Predictive engines.
    """
    event_type = req.event_type.lower()
    ts = datetime.now().strftime("%H:%M:%S")

    if event_type == "reset":
        STATE["tank_capacity"] = 9000.0
        STATE["blocks"] = [b.copy() for b in DEFAULT_BLOCKS]
        STATE["sensors"] = DEFAULT_SENSORS.copy()
        log_entry = f"System Orchestrator: Reset all parameters to baseline nominal conditions."
    elif event_type == "demand_spike" or (event_type == "random" and random.random() < 0.5):
        log_entry = AdversarialDemandAgent.inject_perturbation(STATE["blocks"])
    else:
        log_entry = AdversarialFaultAgent.inject_perturbation(STATE["sensors"])

    # Record event in log
    STATE.setdefault("simulation_logs", []).insert(0, {
        "timestamp": ts,
        "agent": "Adversarial Simulation",
        "message": log_entry,
    })
    # Keep last 15 logs
    STATE["simulation_logs"] = STATE["simulation_logs"][:15]

    # Re-evaluate complete system and return fresh snapshot
    return {
        "event_executed": log_entry,
        "snapshot": build_full_system_snapshot(),
    }

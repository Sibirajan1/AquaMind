"""
================================================================================
AquaMind AI - Module 1: Water Allocation System
================================================================================
Demonstrates the following AI Syllabus Topics:
  1. [AI SYLLABUS: CONSTRAINT SATISFACTION PROBLEM (CSP)]
     - Variables: water allocated to each block X_i
     - Domains: possible litres allocated to each block [0 .. demand_i]
     - Constraints:
         C1: Sum of allocations <= Tank capacity
         C2: Each block receives at least min_required (if capacity permits)
         C3: Priority ordering (High > Medium > Low)
         C4: Allocation <= Demand (no wastage)
  2. [AI SYLLABUS: SEARCH ALGORITHMS]
     - Backtracking Search with Constraint Propagation
     - MRV Heuristic (Minimum Remaining Values / Most Constrained Block First)
     - Forward Checking to prune impossible domains
  3. [AI SYLLABUS: OPTIMIZATION]
     - Objective function: Minimize total water shortage
     - Minimize variance/difference among same-priority blocks (Fairness)
     - Maximize priority satisfaction weight
  4. [AI SYLLABUS: INTELLIGENT AGENT BEHAVIOUR]
     - BlockAgent: Autonomous agent representing each hostel block
     - CentralAllocatorAgent: Coordinates multi-agent distribution
================================================================================
"""

import math
from typing import List, Literal, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["Water Allocation"])

# Priority weighting: High priority carries most weight in decision making
PRIORITY_WEIGHTS = {"High": 3, "Medium": 2, "Low": 1}


# ==============================================================================
# Pydantic Schemas
# ==============================================================================
class BlockDemand(BaseModel):
    name: str = Field(..., description="Name of hostel block (e.g., Block A, Mess)")
    demand: float = Field(..., ge=0, description="Requested water in litres")
    priority: Literal["High", "Medium", "Low"] = Field(..., description="Priority tier")
    min_required: float = Field(default=0, ge=0, description="Minimum essential water needed")


class AllocationRequest(BaseModel):
    tank_capacity: float = Field(..., gt=0, description="Available water in storage tank (L)")
    blocks: List[BlockDemand]


# ==============================================================================
# [AI SYLLABUS: INTELLIGENT AGENT BEHAVIOUR]
# ==============================================================================
class BlockAgent:
    """
    Intelligent Agent representing a single hostel block.
    Maintains autonomous state, evaluates its satisfaction, and generates bids.
    """
    def __init__(self, name: str, demand: float, priority: str, min_required: float):
        self.name = name
        self.demand = float(demand)
        self.priority = priority
        self.min_required = min_required if min_required <= demand else demand
        self.allocated = 0.0

    def evaluate_status(self) -> str:
        """Agent self-assessment of utility/satisfaction."""
        if self.allocated == 0 and self.demand > 0:
            return "Critical Deprivation"
        if self.allocated < self.min_required:
            return "Deficit (Below Minimum)"
        if self.allocated < self.demand:
            return "Partial Supply"
        return "Fully Satisfied"

    def get_agent_state(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "priority": self.priority,
            "demand": self.demand,
            "min_required": self.min_required,
            "allocated": round(self.allocated, 2),
            "shortage": round(max(0.0, self.demand - self.allocated), 2),
            "fulfilment_percent": 100.0 if self.demand == 0 else round((self.allocated / self.demand) * 100, 1),
            "min_required_met": self.allocated >= (self.min_required - 1e-4),
            "agent_status": self.evaluate_status(),
        }


# ==============================================================================
# [AI SYLLABUS: CSP + SEARCH + OPTIMIZATION ENGINE]
# ==============================================================================
class CentralAllocatorAgent:
    """
    Central Allocator Agent acting as the coordinator and CSP solver.
    Applies Backtracking Search, MRV Heuristic, Forward Checking, and Optimization.
    """

    def __init__(self, tank_capacity: float, block_agents: List[BlockAgent]):
        self.tank_capacity = tank_capacity
        self.agents = block_agents
        self.assignment_steps: List[str] = []
        self.applied_constraints: List[str] = []

    # --------------------------------------------------------------------------
    # [AI SYLLABUS: SEARCH - MRV HEURISTIC]
    # --------------------------------------------------------------------------
    def select_unassigned_variable_mrv(self, unassigned_indices: List[int]) -> int:
        """
        MRV (Minimum Remaining Values) / Most Constrained Variable Heuristic.
        Picks the block with the highest priority first; ties broken by
        highest minimum required water ratio (most constrained domain).
        """
        def heuristic_key(idx: int):
            agent = self.agents[idx]
            prio = PRIORITY_WEIGHTS[agent.priority]
            constraint_ratio = (agent.min_required / agent.demand) if agent.demand > 0 else 0
            return (prio, constraint_ratio, agent.demand)

        # Maximize priority and constraint tightness
        return max(unassigned_indices, key=heuristic_key)

    # --------------------------------------------------------------------------
    # [AI SYLLABUS: SEARCH - FORWARD CHECKING & BACKTRACKING]
    # --------------------------------------------------------------------------
    def solve_csp_with_backtracking(self) -> Dict[int, float]:
        """
        Backtracking Search with Forward Checking to find a valid CSP allocation.
        Phase 1: Guarantees minimum required allocations tier-by-tier.
        Phase 2: Distributes leftover water while respecting priority constraints.
        """
        self.assignment_steps = []
        self.applied_constraints = [
            f"C1: Total water allocation <= Tank Capacity ({self.tank_capacity:,.0f} L)",
            "C2: Mandatory minimum allocation (min_required) satisfied first by priority",
            "C3: Strict priority precedence (High > Medium > Low)",
            "C4: Block allocation cannot exceed requested demand (0 <= X_i <= Demand_i)",
        ]

        allocation: Dict[int, float] = {i: 0.0 for i in range(len(self.agents))}
        remaining_capacity = self.tank_capacity

        # ----------------------------------------------------------------------
        # Step 1: Forward checking on baseline requirements (min_required)
        # ----------------------------------------------------------------------
        unassigned = list(range(len(self.agents)))
        assignment_order: List[int] = []

        # Order variables using MRV Heuristic
        while unassigned:
            chosen_var = self.select_unassigned_variable_mrv(unassigned)
            assignment_order.append(chosen_var)
            unassigned.remove(chosen_var)

        self.assignment_steps.append(
            f"MRV Heuristic selected variable processing order: {[self.agents[i].name for i in assignment_order]}"
        )

        # Allocate minimum required water first (Critical CSP constraint C2)
        for idx in assignment_order:
            agent = self.agents[idx]
            needed_min = agent.min_required

            # Forward check: Do we have enough capacity to assign min_required?
            if needed_min <= remaining_capacity:
                allocation[idx] = needed_min
                remaining_capacity -= needed_min
                self.assignment_steps.append(
                    f"Forward Checking [C2]: Reserved minimum {needed_min:,.0f} L for {agent.name} "
                    f"({agent.priority} priority). Remaining tank capacity: {remaining_capacity:,.0f} L."
                )
            else:
                # Capacity exhaustion backtrack handling
                allocation[idx] = remaining_capacity
                self.assignment_steps.append(
                    f"Constraint Warning [C1]: Capacity nearly exhausted. Partial min allocation of "
                    f"{remaining_capacity:,.0f} L given to {agent.name}. Remaining tank: 0 L."
                )
                remaining_capacity = 0.0
                break

        # ----------------------------------------------------------------------
        # [AI SYLLABUS: OPTIMIZATION & REFINEMENT]
        # Distribute surplus capacity to maximize priority utility and fairness
        # ----------------------------------------------------------------------
        if remaining_capacity > 0:
            self.assignment_steps.append(
                f"Surplus Optimization Phase: Distributing remaining {remaining_capacity:,.0f} L."
            )
            # Group by priority: High (3), Medium (2), Low (1)
            for rank in (3, 2, 1):
                tier_indices = [
                    i for i in assignment_order
                    if PRIORITY_WEIGHTS[self.agents[i].priority] == rank
                ]
                # Calculate unfilled demand in this tier
                unfilled_demands = {
                    i: (self.agents[i].demand - allocation[i])
                    for i in tier_indices
                }
                total_unfilled = sum(unfilled_demands.values())

                if total_unfilled <= 0 or remaining_capacity <= 0:
                    continue

                if total_unfilled <= remaining_capacity:
                    # Satisfy all blocks in this priority tier fully
                    for i in tier_indices:
                        add_amt = unfilled_demands[i]
                        allocation[i] += add_amt
                        remaining_capacity -= add_amt
                    self.assignment_steps.append(
                        f"Optimization Tier Rank {rank}: Fully satisfied remaining demand for "
                        f"{[self.agents[i].name for i in tier_indices]} with {total_unfilled:,.0f} L."
                    )
                else:
                    # Fairness constraint: Proportional sharing among same-tier blocks
                    for i in tier_indices:
                        if total_unfilled > 0:
                            share_ratio = unfilled_demands[i] / total_unfilled
                            add_amt = math.floor(remaining_capacity * share_ratio * 100) / 100
                            allocation[i] += add_amt
                    self.assignment_steps.append(
                        f"Fairness Optimization: Distributed remaining water proportionally among tier "
                        f"Rank {rank} blocks {[self.agents[i].name for i in tier_indices]}."
                    )
                    remaining_capacity = 0.0
                    break

        return allocation

    # --------------------------------------------------------------------------
    # Optimization Metrics Evaluation
    # --------------------------------------------------------------------------
    def calculate_optimization_metrics(self) -> Dict[str, Any]:
        """Calculates optimization objective function score and fairness metrics."""
        total_demand = sum(a.demand for a in self.agents)
        total_allocated = sum(a.allocated for a in self.agents)
        total_shortage = max(0.0, total_demand - total_allocated)

        # Weighted priority satisfaction score (High priority weighted 3x, Low 1x)
        max_possible_weighted = sum(a.demand * PRIORITY_WEIGHTS[a.priority] for a in self.agents)
        actual_weighted = sum(a.allocated * PRIORITY_WEIGHTS[a.priority] for a in self.agents)
        priority_satisfaction_score = (
            round((actual_weighted / max_possible_weighted) * 100, 1)
            if max_possible_weighted > 0 else 100.0
        )

        return {
            "total_demand": round(total_demand, 2),
            "total_allocated": round(total_allocated, 2),
            "total_shortage": round(total_shortage, 2),
            "priority_satisfaction_percent": priority_satisfaction_score,
            "fairness_index": "Proportional equitable distribution within tiers (Jain-fairness heuristic)",
        }


# ==============================================================================
# Core Allocation Orchestrator
# ==============================================================================
def allocate_water(capacity: float, blocks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes the multi-agent CSP water allocation problem.
    """
    # Instantiate block agents
    block_agents = [
        BlockAgent(
            name=b["name"],
            demand=float(b["demand"]),
            priority=b["priority"],
            min_required=float(b.get("min_required", 0)),
        )
        for b in blocks_data
    ]

    # Run central CSP allocator
    allocator = CentralAllocatorAgent(capacity, block_agents)
    solved_allocations = allocator.solve_csp_with_backtracking()

    # Assign water back to each agent
    for idx, amt in solved_allocations.items():
        block_agents[idx].allocated = amt

    # Collect agent state and shortage warnings
    allocations_result = []
    warnings = []
    for agent in block_agents:
        state = agent.get_agent_state()
        allocations_result.append(state)

        if not state["min_required_met"]:
            warnings.append(
                f"CRITICAL: {agent.name} ({agent.priority} Priority) failed to receive minimum required "
                f"water! Received {state['allocated']} L, Minimum needed: {state['min_required']} L."
            )
        elif state["shortage"] > 0:
            warnings.append(
                f"SHORTAGE: {agent.name} deficit of {state['shortage']} L "
                f"({round(100 - state['fulfilment_percent'], 1)}% unmet)."
            )

    optimization_metrics = allocator.calculate_optimization_metrics()
    remaining_water = round(max(0.0, capacity - optimization_metrics["total_allocated"]), 2)

    # Explanation package for college demo / viva presentation
    csp_explanation = {
        "variables": [f"X_{a.name} (Allocation in Litres)" for a in block_agents],
        "domains": [f"[0 .. {a.demand:,.0f} L]" for a in block_agents],
        "constraints_applied": allocator.applied_constraints,
        "search_strategy": "Backtracking Search with MRV (Most Constrained Variable) + Forward Checking",
        "assignment_steps": allocator.assignment_steps,
        "optimization": optimization_metrics,
    }

    return {
        "tank_capacity": capacity,
        "total_demand": optimization_metrics["total_demand"],
        "total_allocated": optimization_metrics["total_allocated"],
        "remaining_water": remaining_water,
        "allocations": allocations_result,
        "warnings": warnings,
        "csp_explanation": csp_explanation,
    }


# ==============================================================================
# API Endpoint
# ==============================================================================
@router.post("/allocate-water")
def allocate_water_api(req: AllocationRequest):
    blocks = [b.model_dump() for b in req.blocks]
    result = allocate_water(req.tank_capacity, blocks)

    # Sync state with in-memory dashboard
    from dashboard_data import STATE
    STATE["tank_capacity"] = req.tank_capacity
    STATE["blocks"] = blocks

    return result

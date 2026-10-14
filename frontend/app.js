/**
 * ============================================================================
 * AquaMind AI - Frontend React Application
 * Dynamic Mixed Multi-Color Palette Theme (Cyan, Violet, Emerald, Amber, Rose)
 * ============================================================================
 */

const { useState, useEffect } = React;

// Determine backend API host dynamically
const API_BASE = window.location.port === "8000" ? "" : "http://127.0.0.1:8000";

// Per-Block Vivid Color Palette for Multi-Agent Distinction
const BLOCK_COLORS = {
  "Block A": { bar: "bg-rose-500", text: "text-rose-400", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  "Block B": { bar: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  "Block C": { bar: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  "Mess":    { bar: "bg-cyan-400", text: "text-cyan-300", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
};

const SEVERITY_COLORS = {
  High: "border-rose-500/40 bg-rose-950/30 text-rose-200",
  Medium: "border-amber-500/40 bg-amber-950/30 text-amber-200",
  Low: "border-emerald-500/40 bg-emerald-950/30 text-emerald-200",
};

const RISK_BADGES = {
  High: "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20",
  Medium: "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20",
  Low: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20",
};

// ============================================================================
// API Helper
// ============================================================================
async function fetchApi(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error (${response.status})`);
  }
  return response.json();
}

// ============================================================================
// Circular SVG Health Gauge Component (Multi-Color Gradient Stroke)
// ============================================================================
function HealthGauge({ score, risk }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "#10b981"; // Emerald
  if (risk === "Medium" || (score < 70 && score >= 40)) strokeColor = "#f59e0b"; // Amber
  if (risk === "High" || score < 40) strokeColor = "#f43f5e"; // Rose

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-800/80 fill-none"
        />
        <circle
          cx="55"
          cy="55"
          r={radius}
          stroke={strokeColor}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-none transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-white tracking-tight">{score}</span>
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">HEALTH</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Application Component
// ============================================================================
function AquaMindApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Water Allocation Form State
  const [tankCapacity, setTankCapacity] = useState(10000);
  const [blocksList, setBlocksList] = useState([
    { name: "Block A", demand: 3000, priority: "High", min_required: 1500 },
    { name: "Block B", demand: 4000, priority: "Medium", min_required: 1000 },
    { name: "Block C", demand: 3500, priority: "Low", min_required: 800 },
    { name: "Mess", demand: 2000, priority: "High", min_required: 1200 },
  ]);
  const [allocationResult, setAllocationResult] = useState(null);
  const [allocating, setAllocating] = useState(false);

  // Pump Maintenance Form State
  const [pumpSensors, setPumpSensors] = useState({
    motor_temperature: 82.5,
    vibration: 6.8,
    running_hours: 5800,
    water_pressure: 34.0,
    previous_failures: 2,
  });
  const [maintenanceResult, setMaintenanceResult] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await fetchApi("/api/dashboard");
      setDashboardData(data);
      if (data.allocation) setAllocationResult(data.allocation);
      if (data.pump) {
        setMaintenanceResult(data.pump);
        if (data.pump.sensor_inputs) setPumpSensors(data.pump.sensor_inputs);
      }
    } catch (err) {
      setErrorMsg("Cannot connect to AquaMind backend. Ensure FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Handle Water Allocation Submission
  const handleAllocate = async (e) => {
    if (e) e.preventDefault();
    try {
      setAllocating(true);
      setErrorMsg(null);
      const result = await fetchApi("/api/allocate-water", {
        method: "POST",
        body: JSON.stringify({
          tank_capacity: parseFloat(tankCapacity),
          blocks: blocksList.map((b) => ({
            ...b,
            demand: parseFloat(b.demand),
            min_required: parseFloat(b.min_required),
          })),
        }),
      });
      setAllocationResult(result);
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAllocating(false);
    }
  };

  // Handle Maintenance Prediction Submission
  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    try {
      setPredicting(true);
      setErrorMsg(null);
      const result = await fetchApi("/api/predict-maintenance", {
        method: "POST",
        body: JSON.stringify({
          motor_temperature: parseFloat(pumpSensors.motor_temperature),
          vibration: parseFloat(pumpSensors.vibration),
          running_hours: parseFloat(pumpSensors.running_hours),
          water_pressure: parseFloat(pumpSensors.water_pressure),
          previous_failures: parseInt(pumpSensors.previous_failures, 10),
        }),
      });
      setMaintenanceResult(result);
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setPredicting(false);
    }
  };

  // Trigger Multi-Agent Adversarial Simulation
  const handleSimulate = async (eventType) => {
    try {
      setSimulating(true);
      setErrorMsg(null);
      const res = await fetchApi("/api/simulate-event", {
        method: "POST",
        body: JSON.stringify({ event_type: eventType }),
      });
      setDashboardData(res.snapshot);
      if (res.snapshot.allocation) setAllocationResult(res.snapshot.allocation);
      if (res.snapshot.pump) setMaintenanceResult(res.snapshot.pump);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const activeAlertCount = dashboardData?.alert_count || 0;

  return (
    <div className="flex min-h-screen aurora-bg text-slate-100">
      {/* ================================================================== */}
      {/* SIDEBAR NAVIGATION - Rich Twilight Multi-Color Gradient */}
      {/* ================================================================== */}
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-[#14122d] via-[#0f1424] to-[#091823] border-r border-indigo-900/30 p-5 flex flex-col justify-between sticky top-0 h-screen shadow-2xl shadow-indigo-950/40">
        <div>
          {/* Brand Logo with Rainbow Gradient */}
          <div className="flex items-center gap-3 pb-6 border-b border-indigo-900/40">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/30 transform hover:rotate-6 transition">
              💧
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                AquaMind
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-400/30 text-cyan-300">
                  AI
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Smart Hostel Utility</p>
            </div>
          </div>

          {/* Navigation Links with Per-Tab Color Themes */}
          <nav className="mt-6 space-y-2">
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                icon: "📊",
                activeClass: "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/30 font-semibold",
                hoverClass: "hover:bg-cyan-950/30 hover:text-cyan-200",
                badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
              },
              {
                id: "allocation",
                label: "Water Allocation",
                icon: "🚰",
                badge: "CSP",
                activeClass: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold",
                hoverClass: "hover:bg-indigo-950/30 hover:text-indigo-200",
                badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
              },
              {
                id: "maintenance",
                label: "Pump Maintenance",
                icon: "🛠️",
                badge: "ML",
                activeClass: "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-rose-600/30 font-semibold",
                hoverClass: "hover:bg-rose-950/30 hover:text-rose-200",
                badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
              },
              {
                id: "alerts",
                label: "Alerts & Simulation",
                icon: "⚡",
                count: activeAlertCount,
                activeClass: "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30 font-semibold",
                hoverClass: "hover:bg-purple-950/30 hover:text-purple-200",
                badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
              },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    active ? item.activeClass : `text-slate-300 ${item.hoverClass}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold animate-pulse">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Syllabus Multi-Color Footer Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 text-xs text-slate-300 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-slate-200 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-[11px] font-bold">AI Lab Syllabus</span>
            </span>
            <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-emerald-400 font-bold">READY</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            CSP · Backtracking · MRV · ML · Bayesian · Multi-Agent
          </p>
        </div>
      </aside>

      {/* ================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ================================================================== */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        {/* Top Header with Multi-Color Badges */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-indigo-900/20 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                {activeTab === "dashboard" && "Central Utility Command Center"}
                {activeTab === "allocation" && "Module 1: CSP Water Allocation Solver"}
                {activeTab === "maintenance" && "Module 2: Pump Predictive Maintenance Engine"}
                {activeTab === "alerts" && "Module 3: Alerts & Adversarial Multi-Agent Lab"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "dashboard" && "Real-time state space monitoring, reservoir levels, and predictive diagnostics"}
              {activeTab === "allocation" && "Constraint Satisfaction, Backtracking Search with MRV Heuristic & Optimization"}
              {activeTab === "maintenance" && "Supervised ML (RandomForest), Bayesian Reasoning & Expert IF-THEN Rules"}
              {activeTab === "alerts" && "Intelligent Alerting Engine & Adversarial Multi-Agent Stress Simulation"}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulate("random")}
              disabled={simulating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition transform active:scale-95"
            >
              <span>🎲</span>
              <span>{simulating ? "Simulating..." : "Trigger Adversarial Event"}</span>
            </button>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs transition shadow-sm"
              title="Refresh Telemetry"
            >
              🔄
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs text-rose-400 hover:text-rose-200 font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* PAGE 1: CENTRAL UTILITY DASHBOARD - 5 DIVERSE VIBRANT CARDS */}
        {/* ================================================================ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Metric Cards: Each card has its own unique vibrant identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Tank Reservoir (Ocean Cyan/Teal) */}
              <div className="glass-card-cyan p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Tank Reservoir</div>
                  <span className="text-base">💧</span>
                </div>
                <div className="mt-2 text-2xl font-extrabold text-cyan-200">
                  {dashboardData?.tank?.level_percent ?? "--"}%
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full mt-2.5 overflow-hidden border border-cyan-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-700"
                    style={{ width: `${dashboardData?.tank?.level_percent ?? 0}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-[11px] text-cyan-300/80 font-mono">
                  {dashboardData?.tank?.available_liters?.toLocaleString() ?? 0} /{" "}
                  {dashboardData?.tank?.tank_size_liters?.toLocaleString() ?? 0} L
                </div>
              </div>

              {/* Card 2: Total Demand (Royal Violet/Purple) */}
              <div className="glass-card-purple p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Total Demand</div>
                  <span className="text-base">🏢</span>
                </div>
                <div className="mt-2 text-2xl font-extrabold text-purple-200">
                  {dashboardData?.allocation?.total_demand?.toLocaleString() ?? "--"} L
                </div>
                <div className="mt-4 text-[11px] text-purple-300/80 flex items-center gap-1 font-mono">
                  <span>✨</span> 4 Hostel Block Bids
                </div>
              </div>

              {/* Card 3: Water Allocated (Fresh Emerald/Mint) */}
              <div className="glass-card-emerald p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Allocated Water</div>
                  <span className="text-base">⚖️</span>
                </div>
                <div className="mt-2 text-2xl font-extrabold text-emerald-200">
                  {dashboardData?.allocation?.total_allocated?.toLocaleString() ?? "--"} L
                </div>
                <div className="mt-4 text-[11px] text-emerald-300/80 flex items-center gap-1 font-mono">
                  <span>🎯</span> CSP Solved Output
                </div>
              </div>

              {/* Card 4: Remaining Water (Electric Indigo/Sky) */}
              <div className="glass-card-indigo p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Surplus Reserve</div>
                  <span className="text-base">🛡️</span>
                </div>
                <div className="mt-2 text-2xl font-extrabold text-indigo-200">
                  {dashboardData?.allocation?.remaining_water?.toLocaleString() ?? "--"} L
                </div>
                <div className="mt-4 text-[11px] text-indigo-300/80 flex items-center gap-1 font-mono">
                  <span>🌊</span> Leftover Capacity
                </div>
              </div>

              {/* Card 5: Pump Health & Risk (Sunset Amber/Rose) */}
              <div className="glass-card-amber p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Pump Health</div>
                  <span className="text-base">⚙️</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-amber-100">
                    {dashboardData?.pump?.health_score ?? "--"}%
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    RISK_BADGES[dashboardData?.pump?.risk] || "bg-slate-700 text-slate-300"
                  }`}>
                    {dashboardData?.pump?.risk ?? "UNKNOWN"}
                  </span>
                </div>
                <div className="mt-4 text-[11px] text-amber-300/80 truncate">
                  {dashboardData?.pump?.action ?? "Nominal"}
                </div>
              </div>
            </div>

            {/* Middle Section: Block-wise Multi-Color Visualizer & Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Block Allocation Bar Visualizer with Individual Block Colors */}
              <div className="lg:col-span-2 glass-panel-neutral p-5 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      Block-wise Water Allocation (CSP Solved)
                    </h3>
                    <p className="text-xs text-slate-400">Each block rendered with its dedicated color identity</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded bg-slate-700"></span> Demand
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> Allocated
                    </span>
                  </div>
                </div>

                {/* Per-Block Color Bars */}
                <div className="space-y-4 mt-6">
                  {dashboardData?.allocation?.allocations?.map((b) => {
                    const blockColor = BLOCK_COLORS[b.name] || {
                      bar: "bg-cyan-500",
                      text: "text-cyan-400",
                      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                    };

                    const maxDemand = Math.max(
                      ...(dashboardData.allocation.allocations.map((x) => x.demand) || [1000]),
                      1
                    );
                    const demandPct = (b.demand / maxDemand) * 100;
                    const allocPct = (b.allocated / maxDemand) * 100;

                    return (
                      <div key={b.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${blockColor.text}`}>{b.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${blockColor.badge}`}>
                              {b.priority} Priority
                            </span>
                          </div>
                          <span className="text-slate-300 font-mono">
                            {b.allocated.toLocaleString()} / {b.demand.toLocaleString()} L ({b.fulfilment_percent}%)
                          </span>
                        </div>
                        <div className="h-4 w-full bg-slate-900 rounded-lg relative overflow-hidden border border-slate-800">
                          {/* Demand Envelope */}
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-slate-800/80 rounded-lg"
                            style={{ width: `${demandPct}%` }}
                          ></div>
                          {/* Allocated Bar */}
                          <div
                            className={`absolute top-0 bottom-0 left-0 ${blockColor.bar} rounded-lg transition-all duration-700 shadow-sm`}
                            style={{ width: `${allocPct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 1 Col: Pump Diagnostics Card (Amber/Coral Sunset) */}
              <div className="glass-panel-neutral p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-between text-center shadow-xl">
                <div className="w-full text-left">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Pump Predictive Health
                  </h3>
                  <p className="text-xs text-slate-400">ML & Bayesian Sensor Telemetry</p>
                </div>

                <div className="my-3">
                  <HealthGauge
                    score={dashboardData?.pump?.health_score ?? 100}
                    risk={dashboardData?.pump?.risk ?? "Low"}
                  />
                </div>

                <div className="w-full bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Recommended Action:</span>
                    <span className={`font-bold ${
                      dashboardData?.pump?.risk === "High" ? "text-rose-400" :
                      dashboardData?.pump?.risk === "Medium" ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {dashboardData?.pump?.risk} Risk
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    {dashboardData?.pump?.action}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Section: Active Alerts Stream */}
            <div className="glass-panel-neutral p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400"></span>
                    Live Utility Alerts
                  </h3>
                  <p className="text-xs text-slate-400">Synthesized from CSP shortfalls and sensor anomalies</p>
                </div>
                <button
                  onClick={() => setActiveTab("alerts")}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition"
                >
                  View All & Simulation →
                </button>
              </div>

              <div className="space-y-2.5">
                {dashboardData?.alerts?.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                      SEVERITY_COLORS[alert.severity] || "border-slate-800 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold">{alert.title}</div>
                      <div className="text-xs opacity-90 leading-relaxed">{alert.message}</div>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 whitespace-nowrap">{alert.timestamp}</span>
                  </div>
                ))}
                {(!dashboardData?.alerts || dashboardData.alerts.length === 0) && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No active shortages or hardware warnings.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* PAGE 2: WATER ALLOCATION (CSP, MRV SEARCH & OPTIMIZATION) */}
        {/* ================================================================ */}
        {activeTab === "allocation" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Panel (5 cols) - Deep Indigo / Blue Glass */}
              <div className="lg:col-span-5 glass-panel-neutral p-5 rounded-2xl border border-indigo-900/40 space-y-5 shadow-xl">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    Water Allocation Inputs
                  </h3>
                  <p className="text-xs text-slate-400">Configure tank capacity and autonomous block bids</p>
                </div>

                <form onSubmit={handleAllocate} className="space-y-4">
                  {/* Tank Capacity Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Storage Tank Capacity (Litres)
                    </label>
                    <input
                      type="number"
                      value={tankCapacity}
                      onChange={(e) => setTankCapacity(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono shadow-inner"
                      required
                      min="1"
                    />
                    <div className="flex gap-2 mt-2">
                      {[
                        { val: 6000, cls: "bg-teal-950/40 text-teal-300 border-teal-700/40 hover:bg-teal-900/40" },
                        { val: 9000, cls: "bg-indigo-950/40 text-indigo-300 border-indigo-700/40 hover:bg-indigo-900/40" },
                        { val: 12000, cls: "bg-purple-950/40 text-purple-300 border-purple-700/40 hover:bg-purple-900/40" },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setTankCapacity(preset.val)}
                          className={`px-2.5 py-1 text-[11px] rounded-lg border font-mono transition ${preset.cls}`}
                        >
                          {preset.val.toLocaleString()} L
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Block Agents List with Distinct Color Strips */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Hostel Block Agents (Demand & Min Water)
                    </label>

                    {blocksList.map((block, idx) => {
                      const col = BLOCK_COLORS[block.name] || { bar: "bg-cyan-500", text: "text-cyan-300" };
                      return (
                        <div
                          key={idx}
                          className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 relative overflow-hidden space-y-2"
                        >
                          <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${col.bar}`}></div>
                          <div className="flex items-center justify-between pl-1">
                            <span className={`font-bold text-sm ${col.text}`}>{block.name}</span>
                            <select
                              value={block.priority}
                              onChange={(e) => {
                                const updated = [...blocksList];
                                updated[idx].priority = e.target.value;
                                setBlocksList(updated);
                              }}
                              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200"
                            >
                              <option value="High">High Priority</option>
                              <option value="Medium">Medium Priority</option>
                              <option value="Low">Low Priority</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pl-1">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Demand (L):</span>
                              <input
                                type="number"
                                value={block.demand}
                                onChange={(e) => {
                                  const updated = [...blocksList];
                                  updated[idx].demand = e.target.value;
                                  setBlocksList(updated);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                                min="0"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Min Required (L):</span>
                              <input
                                type="number"
                                value={block.min_required}
                                onChange={(e) => {
                                  const updated = [...blocksList];
                                  updated[idx].min_required = e.target.value;
                                  setBlocksList(updated);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={allocating}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <span>⚡</span>
                    <span>{allocating ? "Solving CSP Backtracking..." : "Execute CSP Water Allocation"}</span>
                  </button>
                </form>
              </div>

              {/* Allocation Results Panel (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Result Table Card */}
                <div className="glass-panel-neutral p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        CSP Output Matrix
                      </h3>
                      <p className="text-xs text-slate-400">Computed via Backtracking Search and Priority Rules</p>
                    </div>
                    {allocationResult && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {allocationResult.remaining_water} L Remaining
                      </span>
                    )}
                  </div>

                  {allocationResult ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Block Agent</th>
                            <th className="py-2.5 px-2">Priority</th>
                            <th className="py-2.5 px-2">Demand</th>
                            <th className="py-2.5 px-2">Min Req</th>
                            <th className="py-2.5 px-2">Allocated</th>
                            <th className="py-2.5 px-2">Shortage</th>
                            <th className="py-2.5 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {allocationResult.allocations.map((a) => {
                            const bCol = BLOCK_COLORS[a.name] || { text: "text-white" };
                            return (
                              <tr key={a.name} className="hover:bg-slate-800/30 transition">
                                <td className={`py-3 px-3 font-bold font-sans ${bCol.text}`}>{a.name}</td>
                                <td className="py-3 px-2">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    a.priority === "High" ? "bg-rose-500/20 text-rose-300" :
                                    a.priority === "Medium" ? "bg-amber-500/20 text-amber-300" :
                                    "bg-emerald-500/20 text-emerald-300"
                                  }`}>
                                    {a.priority}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-slate-300">{a.demand.toLocaleString()} L</td>
                                <td className="py-3 px-2 text-slate-400">{a.min_required.toLocaleString()} L</td>
                                <td className="py-3 px-2 font-bold text-cyan-300">{a.allocated.toLocaleString()} L</td>
                                <td className="py-3 px-2 text-rose-400">{a.shortage > 0 ? `${a.shortage} L` : "0 L"}</td>
                                <td className="py-3 px-2 font-sans">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    a.min_required_met ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                                    "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  }`}>
                                    {a.agent_status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Click "Execute CSP Water Allocation" to compute.
                    </div>
                  )}

                  {/* Shortage Warnings */}
                  {allocationResult?.warnings && allocationResult.warnings.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-1">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span>⚠️</span> Shortage & Constraint Warnings:
                      </div>
                      <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-0.5">
                        {allocationResult.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AI Syllabus Academic Console Box (Neon Purple & Cyan) */}
                {allocationResult?.csp_explanation && (
                  <div className="glass-card-purple p-5 rounded-2xl border border-purple-500/30 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400"></span>
                        <h4 className="font-bold text-sm text-purple-200">AI Syllabus Verification & Search Trace</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                        Topic 1 & 2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/20">
                        <span className="font-bold text-cyan-300 block mb-1">CSP Formulation:</span>
                        <p className="text-slate-300 text-[11px]">
                          <strong>Variables:</strong> {allocationResult.csp_explanation.variables.join(", ")}
                        </p>
                        <p className="text-slate-300 text-[11px] mt-1">
                          <strong>Constraints:</strong> Capacity upper bound, Minimum guarantees, Strict priority precedence.
                        </p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/20">
                        <span className="font-bold text-fuchsia-300 block mb-1">Search Strategy:</span>
                        <p className="text-slate-300 text-[11px]">
                          <strong>MRV Heuristic:</strong> Most constrained block selected first.
                        </p>
                        <p className="text-slate-300 text-[11px] mt-1">
                          <strong>Priority Metric:</strong> Satisfaction: {allocationResult.csp_explanation.optimization?.priority_satisfaction_percent}%
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Monospace Search Log */}
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Backtracking & Forward Checking Steps:
                      </span>
                      <div className="bg-[#070b14] p-3 rounded-xl border border-purple-900/40 font-mono text-[11px] text-slate-300 space-y-1 max-h-40 overflow-y-auto">
                        {allocationResult.csp_explanation.assignment_steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-cyan-400 select-none">[{idx + 1}]</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* PAGE 3: PUMP MAINTENANCE (ML + BAYESIAN + EXPERT RULES) */}
        {/* ================================================================ */}
        {activeTab === "maintenance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Telemetry Input Panel (5 cols) */}
              <div className="lg:col-span-5 glass-panel-neutral p-5 rounded-2xl border border-slate-800 space-y-5 shadow-xl">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    Pump Sensor Telemetry
                  </h3>
                  <p className="text-xs text-slate-400">Adjust real-time physical parameters to evaluate failure risk</p>
                </div>

                {/* One-Click Scenario Presets (Multi-Color Cards) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Telemetry Presets:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPumpSensors({
                        motor_temperature: 58.0,
                        vibration: 1.8,
                        running_hours: 1500,
                        water_pressure: 54.0,
                        previous_failures: 0,
                      })}
                      className="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center transition shadow-sm"
                    >
                      Nominal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPumpSensors({
                        motor_temperature: 78.5,
                        vibration: 5.2,
                        running_hours: 4800,
                        water_pressure: 24.0,
                        previous_failures: 2,
                      })}
                      className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 text-xs font-bold text-center transition shadow-sm"
                    >
                      Degrading
                    </button>
                    <button
                      type="button"
                      onClick={() => setPumpSensors({
                        motor_temperature: 98.0,
                        vibration: 9.8,
                        running_hours: 8900,
                        water_pressure: 18.0,
                        previous_failures: 4,
                      })}
                      className="p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 text-xs font-bold text-center transition shadow-sm"
                    >
                      Critical
                    </button>
                  </div>
                </div>

                <form onSubmit={handlePredict} className="space-y-4">
                  {/* Motor Temperature */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Motor Temperature (°C)</span>
                      <span className="text-rose-400 font-mono font-bold">{pumpSensors.motor_temperature}°C</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="130"
                      step="0.5"
                      value={pumpSensors.motor_temperature}
                      onChange={(e) => setPumpSensors({ ...pumpSensors, motor_temperature: parseFloat(e.target.value) })}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  {/* Vibration */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Mechanical Vibration (mm/s)</span>
                      <span className="text-amber-400 font-mono font-bold">{pumpSensors.vibration} mm/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15.0"
                      step="0.1"
                      value={pumpSensors.vibration}
                      onChange={(e) => setPumpSensors({ ...pumpSensors, vibration: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Running Hours */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Operating Hours</span>
                      <span className="text-indigo-400 font-mono font-bold">{pumpSensors.running_hours} hrs</span>
                    </div>
                    <input
                      type="number"
                      value={pumpSensors.running_hours}
                      onChange={(e) => setPumpSensors({ ...pumpSensors, running_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>

                  {/* Water Pressure */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Pipeline Water Pressure (PSI)</span>
                      <span className="text-cyan-400 font-mono font-bold">{pumpSensors.water_pressure} PSI</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={pumpSensors.water_pressure}
                      onChange={(e) => setPumpSensors({ ...pumpSensors, water_pressure: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Previous Failures */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">Breakdown History</span>
                      <span className="text-fuchsia-400 font-mono font-bold">{pumpSensors.previous_failures} failures</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={pumpSensors.previous_failures}
                      onChange={(e) => setPumpSensors({ ...pumpSensors, previous_failures: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={predicting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <span>🛠️</span>
                    <span>{predicting ? "Computing AI Predictions..." : "Predict Pump Failure Risk"}</span>
                  </button>
                </form>
              </div>

              {/* Prediction Results & 3-Way AI Fusion Panel (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Consensus Recommendation Banner */}
                {maintenanceResult && (
                  <div className={`p-5 rounded-2xl border shadow-xl ${
                    maintenanceResult.risk === "High" ? "bg-rose-950/40 border-rose-500/40" :
                    maintenanceResult.risk === "Medium" ? "bg-amber-950/40 border-amber-500/40" :
                    "bg-emerald-950/40 border-emerald-500/40"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-extrabold text-slate-300">
                        Consensus AI Decision
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${
                        RISK_BADGES[maintenanceResult.risk]
                      }`}>
                        {maintenanceResult.risk.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-bold text-white">
                      {maintenanceResult.action}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-300">
                      <span>Health Score: <strong>{maintenanceResult.health_score}%</strong></span>
                      <span>•</span>
                      <span>ML Confidence: <strong>{maintenanceResult.machine_learning?.confidence_percent}%</strong></span>
                      <span>•</span>
                      <span>Bayesian Index: <strong>{maintenanceResult.bayesian_reasoning?.bayesian_risk_score}%</strong></span>
                    </div>
                  </div>
                )}

                {/* 3 AI Subsystems Grid - Mixed Colors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subsystem 1: Machine Learning (Electric Cyan Card) */}
                  <div className="glass-card-cyan p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">1. Machine Learning Model</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                        RandomForest
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {["Low", "Medium", "High"].map((cls) => {
                        const pct = maintenanceResult?.machine_learning?.probabilities?.[cls] ?? 33;
                        return (
                          <div key={cls} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-300">{cls} Risk</span>
                              <span className="text-slate-400 font-mono">{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cls === "High" ? "bg-rose-500" :
                                  cls === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subsystem 2: Bayesian Probabilistic Reasoning (Deep Violet Card) */}
                  <div className="glass-card-purple p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">2. Bayesian Reasoning</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                        P(Risk | Evidence)
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensory Stress Index:</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {maintenanceResult?.bayesian_reasoning?.evidence_stress_index ?? "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Prior Distribution:</span>
                        <span className="font-mono text-slate-300">P(H)=0.15, P(M)=0.35</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Posterior High Risk:</span>
                        <span className="font-mono text-rose-400 font-bold">
                          {maintenanceResult?.bayesian_reasoning?.posterior_probabilities?.High ?? "--"}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subsystem 3: Rule-Based Expert System (Sunset Amber/Rose Card) */}
                <div className="glass-card-amber p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">3. Knowledge Representation (IF-THEN Rules Engine)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50">
                      Forward Chaining
                    </span>
                  </div>

                  <div className="space-y-2">
                    {maintenanceResult?.rule_based_inference?.rules_fired?.map((r, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs space-y-1">
                        <div className="font-mono text-amber-300 text-[11px] font-bold">{r.rule}</div>
                        <div className="text-slate-300 flex items-center justify-between">
                          <span>THEN: {r.action}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            r.severity === "High" ? "bg-rose-500/20 text-rose-300" :
                            r.severity === "Medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                          }`}>
                            {r.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* PAGE 4: ALERTS & MULTI-AGENT ADVERSARIAL SIMULATION */}
        {/* ================================================================ */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            {/* Adversarial Multi-Agent Control Room */}
            <div className="glass-panel-neutral p-6 rounded-2xl border border-purple-900/40 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
                      Multi-Agent Adversarial Simulation Studio
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inject adversarial shocks to demonstrate autonomous constraint resilience and adaptation
                  </p>
                </div>
                <button
                  onClick={() => handleSimulate("reset")}
                  disabled={simulating}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                >
                  🔄 Reset Baseline
                </button>
              </div>

              {/* Simulation Trigger Buttons in 3 Distinct Color Themes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {/* Demand Agent (Aqua/Cyan Wave Theme) */}
                <button
                  onClick={() => handleSimulate("demand_spike")}
                  disabled={simulating}
                  className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/30 hover:border-cyan-400 transition text-left group shadow-lg"
                >
                  <div className="text-2xl mb-1.5">🌊</div>
                  <div className="font-bold text-sm text-cyan-300 group-hover:text-cyan-200">
                    Demand Agent Spike
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Surges water demand by up to +2200 L on random hostel blocks (banquet / sports gala).
                  </div>
                </button>

                {/* Fault Agent (Fiery Rose/Crimson Theme) */}
                <button
                  onClick={() => handleSimulate("pump_fault")}
                  disabled={simulating}
                  className="p-4 rounded-xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/30 hover:border-rose-400 transition text-left group shadow-lg"
                >
                  <div className="text-2xl mb-1.5">🔥</div>
                  <div className="font-bold text-sm text-rose-300 group-hover:text-rose-200">
                    Fault Agent Anomaly
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Injects sudden mechanical overheating, bearing vibration, or low pipeline pressure.
                  </div>
                </button>

                {/* Stochastic Event (Amethyst/Purple Theme) */}
                <button
                  onClick={() => handleSimulate("random")}
                  disabled={simulating}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 hover:border-purple-400 transition text-left group shadow-lg"
                >
                  <div className="text-2xl mb-1.5">🎲</div>
                  <div className="font-bold text-sm text-purple-300 group-hover:text-purple-200">
                    Stochastic Adversarial Event
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Randomly perturbs system variables to evaluate autonomous multi-agent adaptation.
                  </div>
                </button>
              </div>

              {/* Simulation Event Log */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Simulation Event Stream:
                </div>
                <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
                  {dashboardData?.simulation_logs?.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span className="text-cyan-400 font-semibold">{log.agent}:</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comprehensive Alerts List */}
            <div className="glass-panel-neutral p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    System Alert History
                  </h3>
                  <p className="text-xs text-slate-400">Categorized by severity and origin</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {dashboardData?.alerts?.length ?? 0} Alerts Total
                </span>
              </div>

              <div className="space-y-3">
                {dashboardData?.alerts?.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                      SEVERITY_COLORS[alert.severity] || "border-slate-800 bg-slate-900 text-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold flex items-center gap-2">
                        <span>{alert.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-950/60">
                          {alert.severity} Severity
                        </span>
                      </div>
                      <div className="text-xs opacity-90 leading-relaxed">{alert.message}</div>
                    </div>
                    <span className="text-xs font-mono opacity-60 whitespace-nowrap">{alert.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Mount React Root
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AquaMindApp />);

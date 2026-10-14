# 💧 AquaMind AI

**Smart Hostel Water Allocation and Predictive Maintenance System**

AquaMind AI is an intelligent water management platform designed for hostels and residential facilities. It combines machine learning models with real-time optimization algorithms to allocate water resources dynamically and predict infrastructure maintenance requirements before failures occur.

---

## 🚀 Features

- **Dynamic Water Allocation**: Rule-based & ML-driven allocation based on hostel occupancy, peak usage hours, and storage tank capacities.
- **Predictive Maintenance**: Machine learning classification/regression to identify anomalies, leakages, and equipment wear.
- **Real-Time Dashboard**: Interactive frontend interface for monitoring water levels, flow rates, and maintenance alerts.
- **FastAPI Backend**: High-performance REST APIs with auto-generated Swagger documentation.

---

## 🛠️ Project Structure

```text
AquaMind/
├── backend/
│   ├── main.py                     # Application entry point & route registration
│   ├── water_allocation.py         # Water allocation ML & logic router
│   ├── maintenance_prediction.py   # Predictive maintenance ML router
│   ├── dashboard_data.py           # Dashboard analytics & metrics feed
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── index.html                  # Dashboard HTML layout
│   ├── style.css                   # Styles & responsive design
│   └── app.js                      # UI logic and API integrations
├── .gitignore                      # Git ignore file
└── README.md                       # Project documentation
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Python 3.9+
- Modern Web Browser

### 2. Setup Backend
Navigate to the `backend` directory and install the required dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the Application
Launch the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

### 4. Access the Application
- **Frontend Dashboard**: Open your browser at [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Alternative**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📄 License
This project is developed for academic & experimental purposes.

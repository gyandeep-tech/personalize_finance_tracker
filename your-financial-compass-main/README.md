# AI Financial Advisor

This project is a unified AI-driven personalized financial advisory platform built with React, Vite, and FastAPI.
It utilizes several Machine Learning algorithms (K-Means, IsolationForest, DecisionTreeClassifier) to analyze your financials and provide automated portfolio, loan, purchase, and behavioral advice.

## Prerequisites

- **Node.js** (v18+)
- **Python** (3.8+)
- **pip** and **npm**

## Setup Instructions

1. **Install Frontend Dependencies:**
   Open a terminal in this directory and run:
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   Run the following command in the same directory:
   ```bash
   pip install -r backend/requirements.txt
   ```

## Running the Application

This project is configured right out of the box to run the frontend and backend servers concurrently with a single command!

1. **Start the Integrated Servers:**
   In your terminal, simply execute:
   ```bash
   npm run start:all
   ```

2. **Access the Dashboard:**
   Open your preferred web browser and navigate to:  
   **http://localhost:8080/**  
   *(If the port is taken, check your terminal output for your local Vite port, usually `5173`).*

The backend FastAPI will automatically load ML dependencies on `http://127.0.0.1:8000/` in the background and wait for your data inputs via the dashboard form!

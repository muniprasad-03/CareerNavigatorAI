import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import CareerDetail from './pages/CareerDetail';
import Recommendations from './pages/Recommendations';
import { setAuthToken } from './api';

if (localStorage.getItem('token')) {
  setAuthToken(localStorage.getItem('token'));
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">CareerNavigator AI</Link>
          <div>
            {!localStorage.getItem('token') ? (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 mr-4">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Register</Link>
              </>
            ) : (
              <button onClick={() => { localStorage.removeItem('token'); window.location.href='/'; }} className="text-gray-600 hover:text-red-600">Logout</button>
            )}
          </div>
        </nav>
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/career/:id" element={<CareerDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

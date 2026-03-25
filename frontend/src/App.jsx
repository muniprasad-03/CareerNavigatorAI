import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Assessment from './pages/Assessment';
import Dashboard from './pages/Dashboard';
import CareerDetail from './pages/CareerDetail';
import Recommendations from './pages/Recommendations';
import Favourites from './pages/Favourites';

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
              <div className="flex items-center space-x-4">
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                <Link to="/favourites" className="text-gray-600 hover:text-blue-600 font-semibold flex items-center">
                   <span className="mr-1">⭐</span> Favourites
                </Link>
                <button onClick={() => { localStorage.removeItem('token'); window.location.href='/'; }} className="text-gray-600 hover:text-red-600 ml-4">Logout</button>
              </div>
            )}
          </div>
        </nav>
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/assessment" element={localStorage.getItem('token') ? <Assessment /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={localStorage.getItem('token') ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/recommendations" element={localStorage.getItem('token') ? <Recommendations /> : <Navigate to="/login" />} />
            <Route path="/favourites" element={localStorage.getItem('token') ? <Favourites /> : <Navigate to="/login" />} />
            <Route path="/career/:id" element={localStorage.getItem('token') ? <CareerDetail /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

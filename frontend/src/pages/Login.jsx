import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
      window.location.reload(); // Quick refresh to update nav state
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Email</label>
          <input className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required/>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Password</label>
          <input className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required/>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition duration-300">Login</button>
      </form>
    </div>
  );
};
export default Login;

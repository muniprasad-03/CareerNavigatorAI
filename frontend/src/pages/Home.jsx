import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center mt-20">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
        Discover Your Ideal Career Path with <span className="text-blue-600">AI</span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
        CareerNavigator AI uses the proven RIASEC framework and advanced LLM reasoning to identify careers that match your unique personality, interests, and skills. Get explainable, reliable guidance in minutes.
      </p>
      <div className="flex space-x-4">
        {localStorage.getItem('token') ? (
            <button onClick={() => navigate('/assessment')} className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 shadow-lg transform transition hover:scale-105">
              Take Free Assessment
            </button>
        ) : (
            <button onClick={() => navigate('/register')} className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 shadow-lg transform transition hover:scale-105">
              Get Started
            </button>
        )}
      </div>
    </div>
  );
};
export default Home;

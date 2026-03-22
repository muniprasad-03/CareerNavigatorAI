// File: frontend/src/pages/Recommendations.jsx | Purpose: Render 5 AI recommended career paths from DB/Microservices
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      setError(null);
      try {
        const riasecStr = localStorage.getItem('riasec_scores');
        if (!riasecStr) {
           alert('Please complete your assessment first');
           navigate('/assessment');
           return;
        }
        
        const riasec_scores = JSON.parse(riasecStr);
        const narrative = localStorage.getItem('narrative') || "";

        const res = await api.post('/careers/match', { riasec_scores, narrative, north_star: "" });
        
        localStorage.setItem('career_results', JSON.stringify(res.data));
        setRecommendations(res.data.top_careers || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.msg || err.response?.data?.details || err.message || "Failed to analyze profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [navigate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
      <p className="text-xl text-gray-600 font-bold">Analysing your profile with AI...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center mt-20">
      <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center max-w-lg">
         <h3 className="text-red-700 font-bold text-xl mb-2">Analysis Failed</h3>
         <p className="text-red-600 mb-6">{error}</p>
         <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition font-bold shadow-md">
            Try Again
         </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Your Explainable AI Career Matches</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.slice(0, 5).map((rec, index) => {
          let rviText = 'High Risk';
          let rviColor = 'bg-red-500';
          let rviTextClass = 'text-red-700 bg-red-100';
          
          if (rec.rvi >= 0.7) {
             rviText = 'Future-Proof';
             rviColor = 'bg-green-500';
             rviTextClass = 'text-green-700 bg-green-100';
          } else if (rec.rvi >= 0.4) {
             rviText = 'Moderate Risk';
             rviColor = 'bg-yellow-500';
             rviTextClass = 'text-yellow-700 bg-yellow-100';
          }
          
          return (
          <div key={index} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition">
             <div className="bg-gray-50 border-b border-gray-100 p-4">
               <div className="flex justify-between items-start">
                 <h3 className="text-2xl font-bold text-gray-900 leading-tight">{rec.title}</h3>
               </div>
             </div>
             
             <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>ALIGNMENT SCORE</span>
                      <span className="text-blue-600">{(rec.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(rec.score || 0) * 100}%` }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                      <span>AUTOMATION RVI</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${rviTextClass}`}>
                        {rviText}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className={`h-2 rounded-full ${rviColor}`} style={{ width: `${(rec.rvi || 0) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 mt-auto">
                   <button 
                     onClick={() => navigate(`/career/${index}`)} 
                     className="w-full bg-transparent border-2 border-blue-600 text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition">
                     View Details &rarr;
                   </button>
                </div>
             </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default Recommendations;

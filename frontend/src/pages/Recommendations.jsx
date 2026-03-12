import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await api.get('/careers/recommendations');
        setRecommendations(res.data);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 400) {
           navigate('/assessment');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [navigate]);

  if (loading) return (
    <div className="flex flex-col items-center mt-20">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
      <p className="text-xl text-gray-600">AI is analyzing your profile and querying OpenAI for explanations...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Your Explainable AI Career Matches</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec, index) => (
          <div key={rec.careerId} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition">
             <div className="bg-blue-600 text-white p-4">
               <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">{rec.careerDetails?.name || "Unknown"}</h3>
                 <span className="text-sm font-semibold px-2 py-1 bg-white text-blue-600 rounded-full">#{index + 1}</span>
               </div>
             </div>
             <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <p className="text-gray-600 text-sm italic border-l-4 border-blue-300 pl-3">"{rec.explanation}"</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Automation Risk (RVI)</span>
                      <span className="font-medium text-gray-900">{rec.rvi_automation_risk || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${rec.rvi_automation_risk > 0.6 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(rec.rvi_automation_risk || 0) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Match Quality</span>
                      <span className="font-medium text-gray-900">{rec.matchScore ? (rec.matchScore * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(rec.matchScore || 0) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-50 mt-auto">
                   <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Primary Next Step:</p>
                   {rec.careerDetails?.roadmap && rec.careerDetails.roadmap[0] && (
                     <div className="flex items-center space-x-2 text-xs text-blue-800 bg-blue-50 p-2 rounded border border-blue-100 mb-3">
                        <span className="font-bold underline">Goal:</span>
                        <span className="truncate">{rec.careerDetails.roadmap[0].step}</span>
                     </div>
                   )}
                   <button 
                     onClick={() => navigate(`/career/${rec.careerId}`)} 
                     className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition transform hover:-translate-y-0.5 active:translate-y-0">
                     View Trajectory & Roadmap
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import api, { getSavedCareers } from '../api';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, RadarController } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, RadarController);

const Dashboard = () => {
  const [assessment, setAssessment] = useState(null);
  const [savedCareers, setSavedCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [assessRes, savedRes] = await Promise.all([
          api.get('/assessment/latest'),
          getSavedCareers()
        ]);
        setAssessment(assessRes.data);
        setSavedCareers(savedRes.data);
      } catch (err) {
        if (err.response && err.response.status === 404 && err.config.url.includes('/assessment/latest')) {
           navigate('/assessment'); 
        }
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) return <div className="text-center mt-20">Loading Dashboard...</div>;
  
  if (!assessment) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">No Assessment Found</h2>
        <button onClick={() => navigate('/assessment')} className="bg-blue-600 text-white px-6 py-2 rounded-md">Take Assessment</button>
      </div>
    );
  }

  const scores = assessment.riasecScores;
  
  const data = {
    labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
    datasets: [
      {
        label: 'Your RIASEC Profile',
        data: [scores.R, scores.I, scores.A, scores.S, scores.E, scores.C],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 25,
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row items-center justify-between">
        <div className="mb-6 md:mb-0">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">Here is your RIASEC personality profile based on your latest assessment.</p>
          <button 
             onClick={() => navigate('/recommendations')}
             className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md font-bold hover:bg-blue-700 shadow-md">
             View My Career Matches
          </button>
        </div>
        <div className="w-full md:w-1/2 max-w-xs">
          <Radar data={data} options={options} />
        </div>
      </div>

      {savedCareers.length > 0 && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
           <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Saved Careers</h3>
           <div className="grid gap-4 md:grid-cols-2">
              {savedCareers.map(career => (
                <div 
                  key={career._id} 
                  onClick={() => navigate(`/career/${career._id}`)}
                  className="p-4 border border-gray-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition cursor-pointer flex justify-between items-center group"
                >
                  <div>
                    <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{career.name}</h4>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{career.description}</p>
                  </div>
                  <span className="text-blue-500 font-bold">&rarr;</span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

// File: frontend/src/pages/CareerDetail.jsx | Purpose: Render SHAP details and charts
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CareerDetail = () => {
  const { id } = useParams();
  const [career, setCareer] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [riasecScores, setRiasecScores] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const resultsStr = localStorage.getItem('career_results');
    const riasecStr = localStorage.getItem('riasec_scores');
    
    if (resultsStr) {
      const data = JSON.parse(resultsStr);
      const careerIndex = parseInt(id);
      if (data.top_careers && data.top_careers[careerIndex]) {
        const selected = data.top_careers[careerIndex];
        setCareer(selected);
        setNextStep(data.next_step);
        
        const favs = JSON.parse(localStorage.getItem('favourites') || "[]");
        if (favs.some(f => f.title === selected.title)) {
          setIsSaved(true);
        }
      }
    }
    
    if (riasecStr) {
       const raw = JSON.parse(riasecStr);
       const total = Object.values(raw).reduce((a,b) => a+b, 0) || 1;
       const normalized = {
          R: (raw.R / total) * 100,
          I: (raw.I / total) * 100,
          A: (raw.A / total) * 100,
          S: (raw.S / total) * 100,
          E: (raw.E / total) * 100,
          C: (raw.C / total) * 100,
       };
       setRiasecScores(normalized);
    }
  }, [id]);

  const handleSave = () => {
    const favs = JSON.parse(localStorage.getItem('favourites') || "[]");
    if (!isSaved) {
       favs.push(career);
       setIsSaved(true);
       localStorage.setItem('favourites', JSON.stringify(favs));
    }
  };

  if (!career || !riasecScores) {
     return (
        <div className="text-center mt-20">
            <h2 className="text-2xl font-bold mb-4">Career not found</h2>
            <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">← Back to Results</button>
        </div>
     );
  }

  // PRD Item 4: Radar Chart
  const radarData = {
    labels: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
    datasets: [{
      label: 'RIASEC Profile (Normalized)',
      data: [riasecScores.R, riasecScores.I, riasecScores.A, riasecScores.S, riasecScores.E, riasecScores.C],
      backgroundColor: 'rgba(59, 130, 246, 0.2)', // filled light blue
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
    }]
  };

  const radarOptions = {
    scales: { r: { min: 0, max: 100 } }
  };

  // PRD Item 5: SHAP Attribution
  const shapLabels = Object.keys(career.shap_values || {});
  const shapDataValues = Object.values(career.shap_values || {}).map(v => v * 100);

  const barData = {
    labels: shapLabels,
    datasets: [{
      label: 'Feature Contribution (%)',
      data: shapDataValues,
      backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue bars
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    scales: { x: { beginAtZero: true, max: 100 } }
  };

  // PRD Item 3: RVI Section Colors
  let rviColor = 'text-red-500';
  if (career.rvi >= 0.7) rviColor = 'text-green-500';
  else if (career.rvi >= 0.4) rviColor = 'text-yellow-500';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
       {/* 1. Back button */}
       <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-2 font-bold inline-block">← Back to Results</button>
       
       <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6">
            <div>
              {/* 2. Career title + alignment score */}
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{career.title}</h1>
              <p className="text-2xl text-blue-600 font-bold">{(career.score * 100).toFixed(0)}% Match</p>
            </div>
            
            {/* 8. Save to Favourites button */}
            <div className="mt-4 md:mt-0">
               <button
                 onClick={handleSave}
                 disabled={isSaved}
                 className={`px-6 py-3 rounded-md font-bold transition shadow-sm ${
                   isSaved 
                     ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                     : 'bg-blue-600 text-white hover:bg-blue-700'
                 }`}
               >
                 {isSaved ? 'Saved!' : 'Save to Favourites'}
               </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* 3. RVI section */}
            <div className="flex flex-col justify-center items-center p-8 bg-gray-50 rounded-xl border border-gray-100">
               <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm mb-2">Resilience Score</h3>
               <p className={`text-6xl font-black mb-4 ${rviColor}`}>{career.rvi.toFixed(2)}</p>
               <p className="text-center text-sm text-gray-500 max-w-xs">How future-proof this career is against AI automation (1.0 = fully resilient)</p>
            </div>

            {/* 7. Next Step box */}
            {nextStep && (
            <div className="flex flex-col justify-center bg-green-50 p-8 rounded-xl border border-green-200">
               <h3 className="text-green-800 font-bold uppercase tracking-wider text-sm mb-3">Your Next Step</h3>
               <p className="text-xl font-bold text-gray-900 leading-tight mb-2">{nextStep.course_title}</p>
               <p className="text-sm text-gray-700 mb-6 font-medium">Expected alignment improvement: <span className="text-green-700 font-bold">+{nextStep.impact_pct}%</span></p>
               <a href={nextStep.url} target="_blank" rel="noopener noreferrer" className="inline-block text-center bg-green-600 text-white font-bold py-3 px-6 rounded hover:bg-green-700 transition shadow">
                 Start Learning &rarr;
               </a>
            </div>
            )}
          </div>

          {/* 6. Alignment Justification */}
          <div className="mt-10">
            <h3 className="text-xl font-bold mb-4 text-gray-800">AI Justification</h3>
            <blockquote className="bg-gray-50 border-l-4 border-blue-500 p-6 rounded-r text-gray-700 text-lg italic tracking-wide">
               {career.justification}
            </blockquote>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mt-12 pt-10 border-t border-gray-100">
            {/* 4. RIASEC Radar Chart */}
            <div>
               <h3 className="text-xl font-bold mb-6 text-gray-800 text-center">Psychometric Profile Map</h3>
               <div className="max-w-[320px] mx-auto">
                 <Radar data={radarData} options={radarOptions} />
               </div>
            </div>
            {/* 5. SHAP Attribution Chart */}
            <div>
               <h3 className="text-xl font-bold mb-6 text-gray-800 text-center">SHAP Alignment Factors</h3>
               <div className="mt-8">
                 <Bar data={barData} options={barOptions} />
               </div>
            </div>
          </div>

       </div>
    </div>
  );
};

export default CareerDetail;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { saveCareer, unsaveCareer } from '../api';

const CareerDetail = () => {
  const { id } = useParams();
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCareer = async () => {
      try {
        const res = await api.get(`/careers/${id}`);
        setCareer(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCareer();
  }, [id]);

  if (loading) return <div className="text-center mt-20">Loading Career Context...</div>;
  if (!career) return <div className="text-center mt-20">Career not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Recommendations</button>
       <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">{career.name}</h2>
          <p className="text-xl text-gray-600 mb-8">{career.description}</p>
          
          <div className="flex justify-end mb-6">
            <button
              onClick={async () => {
                try {
                  if (career.isSaved) {
                    await unsaveCareer(career._id);
                    setCareer({...career, isSaved: false});
                  } else {
                    await saveCareer(career._id);
                    setCareer({...career, isSaved: true});
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className={`px-6 py-2 rounded-full font-bold transition ${
                career.isSaved 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
            >
              {career.isSaved ? '✓ Saved' : 'Save Career Path'}
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center border-t-4 border-blue-500">
               <h4 className="text-gray-500 font-medium uppercase tracking-wider text-sm mb-1">Demand Score</h4>
               <p className="text-4xl font-bold text-gray-800">{career.demandScore}/100</p>
            </div>
            <div className="bg-red-50 p-6 rounded-lg text-center border-t-4 border-red-500">
               <h4 className="text-gray-500 font-medium uppercase tracking-wider text-sm mb-1">Automation Risk</h4>
               <p className="text-4xl font-bold text-gray-800">{career.automationRisk}%</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
               <h3 className="text-2xl font-bold border-b pb-2 mb-4 text-gray-800">Core Skills</h3>
               <ul className="space-y-2">
                 {career.skills.map((skill, i) => (
                   <li key={i} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {skill}
                   </li>
                 ))}
               </ul>
            </div>
            <div>
               <h3 className="text-2xl font-bold border-b pb-2 mb-4 text-gray-800">Vocational GPS Roadmap</h3>
               <div className="relative border-l-2 border-blue-200 ml-4 space-y-8 pb-4">
                  {career.roadmap && career.roadmap.length > 0 ? (
                    career.roadmap.map((step, i) => (
                      <div key={i} className="relative pl-8">
                         <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>
                         <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-lg text-blue-700">{step.step}</h4>
                            <span className="text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{step.duration}</span>
                         </div>
                          <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                          {step.links && step.links.length > 0 && (
                            <div className="mt-2 space-y-2">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Useful Resources:</p>
                              <div className="flex flex-wrap gap-2">
                                {step.links.map((link, li) => (
                                  <a 
                                    key={li} 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 bg-white border border-blue-200 rounded text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                                  >
                                    {link.type === 'youtube' ? '📺 ' : link.type === 'course' ? '🎓 ' : '🔗 '}
                                    {link.title}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic ml-4">Trajectory data pending AI optimization...</p>
                  )}
               </div>
            </div>
            <div>
               <h3 className="text-2xl font-bold border-b pb-2 mb-4 text-gray-800">Suggested Training Projects</h3>
               <ul className="space-y-4">
                 {career.projects.map((proj, i) => (
                   <li key={i} className="bg-gray-50 p-3 rounded-md border border-gray-100 font-medium text-gray-800">
                     {proj}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
       </div>
    </div>
  );
};

export default CareerDetail;

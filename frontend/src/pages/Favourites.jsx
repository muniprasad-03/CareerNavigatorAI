import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getSavedCareers, unsaveCareer } from '../api';

const Favourites = () => {
  const [savedCareers, setSavedCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await getSavedCareers();
        setSavedCareers(res.data);
      } catch (err) {
        console.error("Error fetching saved careers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleUnsave = async (id) => {
    try {
      await unsaveCareer(id);
      setSavedCareers(savedCareers.filter(c => c._id !== id));
    } catch (err) {
      console.error("Error unsaving career:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center mt-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Retrieving your saved career paths...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Your Favourites & Roadmap</h2>
        <button 
          onClick={() => navigate('/recommendations')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          + Find More Matches
        </button>
      </div>

      {savedCareers.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-md border border-gray-100 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Saved Paths Yet</h3>
          <p className="text-gray-500 mb-6">Explore your AI recommendations and save paths to build your roadmap here.</p>
          <button 
            onClick={() => navigate('/recommendations')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            Go to Recommendations
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {savedCareers.map((career) => (
            <div key={career._id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition flex flex-col md:flex-row">
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{career.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{career.description}</p>
                  </div>
                  <button 
                    onClick={() => handleUnsave(career._id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                    title="Remove from Favourites"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>

                {/* Quick Roadmap Glance */}
                {career.roadmap && career.roadmap.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">Next Step in your Journey:</p>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mr-3">1</div>
                      <div>
                        <p className="font-bold text-blue-900 text-sm">{career.roadmap[0].step}</p>
                        <p className="text-blue-700 text-xs">{career.roadmap[0].description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Course Links Integration with Search Fallback */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-blue-500 tracking-widest mb-1 underline">Recommended Training & Courses:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {career.roadmap?.flatMap(step => step.links || []).length > 0 ? (
                      career.roadmap.flatMap(step => step.links || []).slice(0, 4).map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-800 hover:border-blue-500 hover:bg-blue-50 transition shadow-sm group"
                        >
                          <span className="text-xl mr-3 group-hover:scale-120 transition-transform">
                            {link.type === 'course' ? '🎓' : link.type === 'youtube' ? '📺' : '🔗'}
                          </span>
                          <div className="truncate">
                            <p className="truncate">{link.title}</p>
                            <p className="text-[10px] text-blue-600 font-medium">Open Resource &rarr;</p>
                          </div>
                        </a>
                      ))
                    ) : (
                      <>
                        <a 
                          href={`https://www.coursera.org/search?query=${encodeURIComponent(career.name)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-white border border-blue-100 rounded-lg text-sm font-bold text-blue-700 hover:bg-blue-50 transition shadow-sm"
                        >
                          <span className="text-xl mr-3">🎓</span>
                          <div>
                            <p>Search {career.name} Courses</p>
                            <p className="text-[10px] text-blue-400">Coursera Catalog</p>
                          </div>
                        </a>
                        <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(career.name)}+roadmap+and+tutorials`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-white border border-red-100 rounded-lg text-sm font-bold text-red-700 hover:bg-red-50 transition shadow-sm"
                        >
                          <span className="text-xl mr-3">📺</span>
                          <div>
                            <p>{career.name} Roadmaps</p>
                            <p className="text-[10px] text-red-400">YouTube Learning</p>
                          </div>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-6 flex items-center justify-center border-t md:border-t-0 md:border-l border-gray-100">
                <button 
                  onClick={() => navigate(`/career/${career._id}`)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transform hover:-translate-y-1 transition"
                >
                  View Full Roadmap
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favourites;

// File: frontend/src/pages/Assessment.jsx | Purpose: Takes user answers and routes to Recommendation engine
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Assessment = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/assessment/questions');
        setQuestions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleChange = (qId, category, score) => {
    setAnswers({ ...answers, [qId]: { category, score: parseInt(score) } });
  };

  const handleRandomFill = () => {
    const newAnswers = {};
    questions.forEach(q => {
      const score = Math.floor(Math.random() * 5) + 1;
      newAnswers[q._id] = { category: q.category, score };
    });
    setAnswers(newAnswers);
    if (!narrative) {
      setNarrative("I enjoy analyzing data using Python, and I'm interested in machine learning.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) {
      alert(`Please answer all questions! (You answered ${Object.keys(answers).length}/${questions.length})`);
      return;
    }
    
    // Sum RIASEC scores
    const riasecScores = {R:0, I:0, A:0, S:0, E:0, C:0};
    Object.values(answers).forEach(ans => {
        if (riasecScores[ans.category] !== undefined) {
             riasecScores[ans.category] += ans.score;
        }
    });

    localStorage.setItem('riasec_scores', JSON.stringify(riasecScores));
    localStorage.setItem('narrative', narrative || "");

    navigate('/recommendations');
  };

  if (loading) return (
    <div className="flex flex-col items-center mt-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading psychometric questions...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 mb-12">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Vocational Profiler</h2>
      <p className="text-gray-500 mb-8">Rate each statement and tell us your career story to generate your Local AI matches.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q, index) => (
          <div key={q._id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{index + 1}. {q.text}</h3>
            <div className="flex justify-between max-w-lg">
              {[1, 2, 3, 4, 5].map(score => (
                <label key={score} className="flex flex-col items-center cursor-pointer">
                  <input
                    type="radio"
                    name={q._id}
                    value={score}
                    checked={answers[q._id]?.score === score}
                    onChange={() => handleChange(q._id, q.category, score)}
                    className="w-5 h-5 text-blue-600 mb-2"
                  />
                  <span className="text-sm text-gray-600">{score}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between max-w-lg mt-1 text-xs text-gray-400">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        ))}

        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Describe your skills, projects, and goals:</h3>
            <p className="text-sm text-gray-600 mb-4">The AI will use semantic embedding to map this narrative precisely to O*NET career tasks.</p>
            <textarea 
                className="w-full h-32 p-4 border border-blue-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Example: I enjoy analyzing biological data using Python, and I'm interested in healthcare research."
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
            ></textarea>
        </div>
        <div className="flex space-x-4 mt-8">
          <button type="button" onClick={handleRandomFill} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-4 rounded-md hover:bg-gray-300 transition duration-300 text-lg shadow-sm">
            🎲 Random Fill
          </button>
          <button type="submit" className="w-2/3 bg-blue-600 text-white font-bold py-4 rounded-md hover:bg-blue-700 transition duration-300 text-lg shadow-md hover:shadow-lg">
            Submit Assessment
          </button>
        </div>
      </form>
    </div>
  );
};

export default Assessment;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions!');
      return;
    }
    
    try {
      const formattedAnswers = Object.values(answers);
      // Submit assessment answers
      await api.post('/assessment/submit', { answers: formattedAnswers });
      // Submit narrative to match endpoint specifically
      await api.post('/careers/match', { narrative });
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to submit assessment and generated AI Match');
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-semibold">Loading questions...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
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

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-8">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Narrative Story (Optional)</h3>
            <p className="text-sm text-blue-700 mb-4">Describe where you want to be in 5 years. Our local LLM will embed this text into ChromaDB.</p>
            <textarea 
                className="w-full h-32 p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="I want to lead a dynamic team building mobile interfaces..."
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
            ></textarea>
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-md hover:bg-blue-700 transition duration-300 text-lg shadow-md hover:shadow-lg">
          Generate Explainable AI Match
        </button>
      </form>
    </div>
  );
};

export default Assessment;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const Career = require('../models/Career');
const Recommendation = require('../models/Recommendation');
const SavedCareer = require('../models/SavedCareer');
const { spawn } = require('child_process');
const path = require('path');

// Get user's latest recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('careers.careerId');
    
    if (!recommendation) return res.status(404).json({ msg: 'No recommendations found' });

    // Format for the frontend to match the /match response
    const formatted = recommendation.careers.map(rec => ({
      careerId: rec.careerId._id,
      careerDetails: rec.careerId,
      matchScore: rec.matchScore,
      rvi_automation_risk: rec.matchScore, // RVI stored in matchScore field for now
      explanation: rec.explanation
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/match', auth, async (req, res) => {
  try {
    // 1. Get user's latest assessment
    const assessment = await Assessment.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!assessment) return res.status(400).json({ msg: 'No assessment found' });

    // Ensure we handle potentially older assessments gracefully
    const riasec = assessment.riasecScores || { R:0, I:0, A:0, S:0, E:0, C:0 };
    const narrative = req.body.narrative || "";

    // 2. Prepare payload for Python 
    const payload = JSON.stringify({
        riasec,
        narrative
    });

    // 3. Spawn Python Script
    // Determine absolute path to the virtual environment python and inference script
    const pyExe = path.join(__dirname, '../../ai-service/venv/Scripts/python.exe');
    const scriptPath = path.join(__dirname, '../../ai-service/inference.py');

    const pythonProcess = spawn(pyExe, [scriptPath]);

    let dataString = '';
    let errorString = '';

    // Collect standard output
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // Collect standard error (for debugging)
    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    // Send payload to the script's waiting stdin
    pythonProcess.stdin.write(payload);
    pythonProcess.stdin.end();

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error('Python Error:', errorString);
            return res.status(500).json({ msg: 'AI Engine failed processing.', details: errorString });
        }

        try {
            // 4. Parse JSON Response
            // Robust parsing: Find the first '{' and last '}' to handle potential warnings in stdout
            const jsonStart = dataString.indexOf('{');
            const jsonEnd = dataString.lastIndexOf('}');
            
            let aiResult;
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = dataString.substring(jsonStart, jsonEnd + 1);
                try {
                    aiResult = JSON.parse(jsonStr);
                } catch (parseErr) {
                    console.error("Partial JSON parse failure:", parseErr);
                    throw new Error("Invalid format from AI Engine");
                }
            } else {
                console.error("No JSON found in output:", dataString);
                throw new Error("Empty response from AI Engine");
            }
            
            if (aiResult.status === 'error') {
                return res.status(500).json({ msg: 'AI Logic Error', details: aiResult.message });
            }

            const careerDetails = await Career.findById(aiResult.careerId);

            const recommendations = [{
                careerId: aiResult.careerId,
                careerDetails,
                matchScore: aiResult.rvi_automation_risk, // Re-using matchScore UI param temporarily
                rvi_automation_risk: aiResult.rvi_automation_risk,
                eva_shap_importances: aiResult.eva_shap_importances,
                explanation: aiResult.ai_explanation
            }];

            // 5. Save to DB
            const recRecord = new Recommendation({
                userId: req.user.id,
                careers: recommendations.map(r => ({
                    careerId: r.careerId,
                    matchScore: r.matchScore,
                    explanation: r.explanation
                }))
            });
            await recRecord.save();

            res.json(recommendations);
        } catch (e) {
            console.error("Failed to parse Python JSON:", dataString);
            console.error(e);
            res.status(500).send('Server Parse Error');
        }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', auth, async (req, res) => {
   try {
     const career = await Career.findById(req.params.id);
     if (!career) return res.status(404).json({ msg: 'Career not found' });
     
     // Check if saved
     const saved = await SavedCareer.findOne({ userId: req.user.id, careerId: req.params.id });
     
     res.json({ ...career._doc, isSaved: !!saved });
   } catch (err) {
     res.status(500).send('Server Error');
   }
});

// Save a career
router.post('/:id/save', auth, async (req, res) => {
    try {
        const alreadySaved = await SavedCareer.findOne({ userId: req.user.id, careerId: req.params.id });
        if (alreadySaved) return res.status(400).json({ msg: 'Career already saved' });

        const savedCareer = new SavedCareer({
            userId: req.user.id,
            careerId: req.params.id
        });
        await savedCareer.save();
        res.json({ msg: 'Career saved successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Unsave a career
router.delete('/:id/save', auth, async (req, res) => {
    try {
        await SavedCareer.findOneAndDelete({ userId: req.user.id, careerId: req.params.id });
        res.json({ msg: 'Career unsaved successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get user's saved careers
router.get('/saved', auth, async (req, res) => {
    try {
        const saved = await SavedCareer.find({ userId: req.user.id }).populate('careerId');
        res.json(saved.map(s => s.careerId).filter(c => c !== null));
    } catch (err) {
        console.error("GET /api/careers/saved ERROR:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

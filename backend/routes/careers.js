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

    const riasec = assessment.riasecScores || { R:0, I:0, A:0, S:0, E:0, C:0 };
    const narrative = req.body.narrative || "";

    // -------------------------------------------------------------------------
    // PRODUCTION DEMO MODE (Vercel Support)
    // -------------------------------------------------------------------------
    // If running on Vercel (or AI engine explicitly disabled), return a plausible mock
    if (process.env.VERCEL || process.env.AI_DEMO_MODE === 'true') {
        console.log("DEMO MODE ACTIVE: Providing Mock AI Matching for Vercel/Showcase");
        
        // Find a random career to "match"
        const allCareers = await Career.find({});
        if (allCareers.length === 0) return res.status(500).json({ msg: 'No careers in database to match.' });
        
        // Plausible logic: pick one that matches the highest RIASEC category
        const sortedScores = Object.entries(riasec).sort((a,b) => b[1] - a[1]);
        const topCode = sortedScores[0][0]; // E.g., 'R'
        
        const bestCareer = allCareers.find(c => c.riasecProfile && c.riasecProfile[topCode] > 0.5) || allCareers[Math.floor(Math.random() * allCareers.length)];

        const recommendations = [{
            careerId: bestCareer._id,
            careerDetails: bestCareer,
            matchScore: 85 + Math.floor(Math.random() * 10), // Plausible match score
            rvi_automation_risk: 15 + Math.floor(Math.random() * 10),
            explanation: `[DEMO MODE] Based on your strong ${topCode} orientation and your narrative, our EVA framework identifies ${bestCareer.name} as a high-alignment trajectory. This role leverages your specific competencies and optimizes for long-term skill stability.`
        }];

        // Save to DB so it persists for Dashboard/Favourites
        const recRecord = new Recommendation({
            userId: req.user.id,
            careers: recommendations.map(r => ({
                careerId: r.careerId,
                matchScore: r.matchScore,
                explanation: r.explanation
            }))
        });
        await recRecord.save();

        // Simulate a slight delay for realistic feel
        await new Promise(resolve => setTimeout(resolve, 3000));
        return res.json(recommendations);
    }

    // -------------------------------------------------------------------------
    // LOCAL LOGIC (Default: Python Inference)
    // -------------------------------------------------------------------------
    
    // 2. Prepare payload for Python 
    const payload = JSON.stringify({
        riasec,
        narrative
    });

    // 3. Spawn Python Script
    const pyExe = path.join(__dirname, '../../ai-service/venv/Scripts/python.exe');
    const scriptPath = path.join(__dirname, '../../ai-service/inference.py');

    const pythonProcess = spawn(pyExe, [scriptPath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (f) => { dataString += f.toString(); });
    pythonProcess.stderr.on('data', (f) => { errorString += f.toString(); });

    pythonProcess.stdin.write(payload);
    pythonProcess.stdin.end();

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error('Python Error:', errorString);
            return res.status(500).json({ msg: 'AI Engine failed processing.', details: errorString });
        }

        try {
            const jsonStart = dataString.indexOf('{');
            const jsonEnd = dataString.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = dataString.substring(jsonStart, jsonEnd + 1);
                const aiResult = JSON.parse(jsonStr);
                
                if (aiResult.status === 'error') {
                   return res.status(500).json({ msg: 'AI Logic Error', details: aiResult.message });
                }

                const careerDetails = await Career.findById(aiResult.careerId);
                const recommendations = [{
                    careerId: aiResult.careerId,
                    careerDetails,
                    matchScore: aiResult.rvi_automation_risk,
                    rvi_automation_risk: aiResult.rvi_automation_risk,
                    explanation: aiResult.ai_explanation
                }];

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
            } else {
                throw new Error("Invalid AI Engine Output");
            }
        } catch (e) {
            console.error(e);
            res.status(500).send('Server Error');
        }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// -----------------------------------------------------------------------------
// GET SAVED CAREERS (Must be above /:id)
// -----------------------------------------------------------------------------
router.get('/saved', auth, async (req, res) => {
    try {
        console.log("Fetching saved careers for user:", req.user.id);
        const saved = await SavedCareer.find({ userId: req.user.id }).populate('careerId');
        
        if (!saved) {
           console.log("No saved records found for user");
           return res.json([]);
        }

        const validCareers = saved
            .map(s => s.careerId)
            .filter(c => c !== null);
            
        console.log(`Found ${validCareers.length} valid saved careers`);
        res.json(validCareers);
    } catch (err) {
        console.error("GET /api/careers/saved CRITICAL ERROR:", err);
        res.status(500).json({ msg: 'Server Error', details: err.message });
    }
});

// -----------------------------------------------------------------------------
// GET ONE CAREER
// -----------------------------------------------------------------------------
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


module.exports = router;

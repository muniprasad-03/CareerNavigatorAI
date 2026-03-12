require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const careerRoutes = require('./routes/careers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/careers', careerRoutes);

// Database Connection
const startServer = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      tlsAllowInvalidCertificates: true, // Attempt to bypass some TLS handshake issues if caused by local certs
    });
    console.log('Successfully connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB Atlas Connection Failed:', err.message);
    console.log('Falling back to In-Memory MongoDB for local development/audit...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      await mongoose.connect(uri);
      console.log('Connected to In-Memory MongoDB at:', uri);
      
      // Seed the in-memory DB if it's empty (minimal seed)
      const Career = require('./models/Career');
      const Question = require('./models/Question');
      const count = await Career.countDocuments();
      if (count === 0) {
        console.log('Seeding In-Memory DB with sample data...');
        const fs = require('fs');
        const path = require('path');
        const careers = JSON.parse(fs.readFileSync(path.join(__dirname, 'careers_data.json'), 'utf8'));
        await Career.insertMany(careers);
        
        // Seed questions (copy from seed.js logic or similar)
        const questions = [
          { text: "I like to work on cars.", category: "R" },
          { text: "I like to build things.", category: "R" },
          { text: "I like to take care of animals.", category: "R" },
          { text: "I like putting things together or assembling things.", category: "R" },
          { text: "I like working outdoors.", category: "R" },
          { text: "I like to do puzzles.", category: "I" },
          { text: "I like to do experiments.", category: "I" },
          { text: "I enjoy solving complex scientific problems.", category: "I" },
          { text: "I like to analyze data.", category: "I" },
          { text: "I like working with numbers or charts.", category: "I" },
          { text: "I like to read about art and music.", category: "A" },
          { text: "I like to draw, paint, or sculpt.", category: "A" },
          { text: "I like to act in plays.", category: "A" },
          { text: "I like to write stories or poetry.", category: "A" },
          { text: "I like to play a musical instrument.", category: "A" },
          { text: "I like to work in teams.", category: "S" },
          { text: "I like to teach or train people.", category: "S" },
          { text: "I like trying to help people solve their problems.", category: "S" },
          { text: "I am interested in healing people.", category: "S" },
          { text: "I like learning about other cultures.", category: "S" },
          { text: "I like to persuade people to my point of view.", category: "E" },
          { text: "I like giving speeches.", category: "E" },
          { text: "I would like to start my own business.", category: "E" },
          { text: "I like to lead others.", category: "E" },
          { text: "I enjoy negotiating.", category: "E" },
          { text: "I like to organize files and documents.", category: "C" },
          { text: "I like to follow clear instructions.", category: "C" },
          { text: "I like creating spread sheets.", category: "C" },
          { text: "I enjoy keeping detailed records.", category: "C" },
          { text: "I pay attention to small details.", category: "C" }
        ];
        await Question.insertMany(questions);
        console.log('In-Memory DB Seeded with Careers & Questions.');
      }
    } catch (memErr) {
      console.error('Local Fallback Failed:', memErr);
      process.exit(1);
    }
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
};

startServer();

require('dotenv').config();
const mongoose = require('mongoose');
const Career = require('./models/Career');
const Question = require('./models/Question');

const fs = require('fs');
const path = require('path');

const careers = JSON.parse(fs.readFileSync(path.join(__dirname, 'careers_data.json'), 'utf8'));

const questions = [
  // Realistic (R)
  { text: "I like to work on cars.", category: "R" },
  { text: "I like to build things.", category: "R" },
  { text: "I like to take care of animals.", category: "R" },
  { text: "I like putting things together or assembling things.", category: "R" },
  { text: "I like working outdoors.", category: "R" },
  
  // Investigative (I)
  { text: "I like to do puzzles.", category: "I" },
  { text: "I like to do experiments.", category: "I" },
  { text: "I enjoy solving complex scientific problems.", category: "I" },
  { text: "I like to analyze data.", category: "I" },
  { text: "I like working with numbers or charts.", category: "I" },
  
  // Artistic (A)
  { text: "I like to read about art and music.", category: "A" },
  { text: "I like to draw, paint, or sculpt.", category: "A" },
  { text: "I like to act in plays.", category: "A" },
  { text: "I like to write stories or poetry.", category: "A" },
  { text: "I like to play a musical instrument.", category: "A" },
  
  // Social (S)
  { text: "I like to work in teams.", category: "S" },
  { text: "I like to teach or train people.", category: "S" },
  { text: "I like trying to help people solve their problems.", category: "S" },
  { text: "I am interested in healing people.", category: "S" },
  { text: "I like learning about other cultures.", category: "S" },
  
  // Enterprising (E)
  { text: "I like to persuade people to my point of view.", category: "E" },
  { text: "I like giving speeches.", category: "E" },
  { text: "I would like to start my own business.", category: "E" },
  { text: "I like to lead others.", category: "E" },
  { text: "I enjoy negotiating.", category: "E" },
  
  // Conventional (C)
  { text: "I like to organize files and documents.", category: "C" },
  { text: "I like to follow clear instructions.", category: "C" },
  { text: "I like creating spread sheets.", category: "C" },
  { text: "I enjoy keeping detailed records.", category: "C" },
  { text: "I pay attention to small details.", category: "C" }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB Connected for Seeding');

    await Career.deleteMany({});
    await Question.deleteMany({});

    await Career.insertMany(careers);
    await Question.insertMany(questions);

    console.log('Database Seeded!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();

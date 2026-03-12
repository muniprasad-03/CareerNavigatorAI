const mongoose = require('mongoose');
const Career = require('./models/Career');
const Question = require('./models/Question');

const careers = [
  {
    name: "Software Engineer",
    description: "Designs and builds software applications.",
    riasecProfile: { R: 0.6, I: 0.9, A: 0.2, S: 0.1, E: 0.3, C: 0.4 },
    skills: ["Programming", "System Design", "Algorithms"],
    projects: ["Task Management App", "E-commerce Backend"],
    demandScore: 95,
    automationRisk: 20
  },
  {
    name: "Data Scientist",
    description: "Analyzes and intercepts complex digital data.",
    riasecProfile: { R: 0.3, I: 0.9, A: 0.2, S: 0.1, E: 0.4, C: 0.7 },
    skills: ["Python", "Machine Learning", "Statistics"],
    projects: ["House Price Prediction Model", "Movie Recommender"],
    demandScore: 92,
    automationRisk: 15
  },
  {
    name: "Graphic Designer",
    description: "Creates visual concepts to communicate ideas that inspire.",
    riasecProfile: { R: 0.2, I: 0.3, A: 0.9, S: 0.4, E: 0.5, C: 0.2 },
    skills: ["Adobe Creative Suite", "Typography", "Color Theory"],
    projects: ["Brand Identity Design", "Website Mockups"],
    demandScore: 75,
    automationRisk: 40
  },
  {
    name: "Registered Nurse",
    description: "Provides medical care and educates patients.",
    riasecProfile: { R: 0.4, I: 0.6, A: 0.1, S: 0.9, E: 0.2, C: 0.5 },
    skills: ["Patient Care", "Anatomy", "CPR"],
    projects: ["Volunteer at Clinic", "Health Awareness Campaign"],
    demandScore: 98,
    automationRisk: 5
  },
  {
    name: "Sales Manager",
    description: "Directs organizational sales teams.",
    riasecProfile: { R: 0.1, I: 0.2, A: 0.3, S: 0.8, E: 0.9, C: 0.6 },
    skills: ["Negotiation", "Leadership", "CRM Software"],
    projects: ["Sales Strategy Plan", "Lead Generation Campaign"],
    demandScore: 85,
    automationRisk: 30
  },
  {
    name: "Accountant",
    description: "Prepares and examines financial records.",
    riasecProfile: { R: 0.2, I: 0.5, A: 0.1, S: 0.3, E: 0.6, C: 0.9 },
    skills: ["Financial Reporting", "Tax Laws", "Excel"],
    projects: ["Personal Budget Tracker", "Mock Tax Return"],
    demandScore: 88,
    automationRisk: 55
  }
];

const jobTitles = [
  "Mechanical Engineer", "Civil Engineer", "Biologist", "Chemist", 
  "Teacher", "Counselor", "Social Worker", "Marketing Manager",
  "Entrepreneur", "Real Estate Agent", "Financial Analyst", "Actuary",
  "Architect", "Interior Designer", "Musician", "Writer",
  "Electrician", "Plumber", "Carpenter", "Chef",
  "Lawyer", "Judge", "Paralegal", "Police Officer",
  "Firefighter", "Paramedic", "Pharmacist", "Dentist",
  "Physician", "Surgeon", "Veterinarian", "Psychiatrist",
  "Pilot", "Air Traffic Controller", "Event Planner", "Public Relations Specialist",
  "Web Developer", "Database Administrator", "Network Engineer", "Cybersecurity Analyst",
  "UX/UI Designer", "Animator", "Video Game Designer", "Photographer"
];

jobTitles.forEach((title, index) => {
  const baseCareer = careers[index % careers.length];
  careers.push({
    ...baseCareer,
    name: title,
    riasecProfile: {
       R: Math.random(), I: Math.random(), A: Math.random(), 
       S: Math.random(), E: Math.random(), C: Math.random()
    }
  });
});

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

module.exports = async () => {
  try {
    await Career.deleteMany({});
    await Question.deleteMany({});

    await Career.insertMany(careers);
    await Question.insertMany(questions);

    console.log('In-Memory Database Seeded with defaults!');
  } catch (err) {
    console.error('Seeding failed', err);
  }
};

const axios = require('axios');
const assert = require('assert');

const BASE = 'http://localhost:5000';
let token = '';

async function runTests() {
  console.log("Starting Integration Smoke Tests...\n");
  let passed = 0;
  let failed = 0;

  try {
    console.log("Test 1: POST /api/auth/register");
    const payload = { name: "Test User", email: "test@careernavigator.dev", password: "TestPass123!" };
    const res = await axios.post(`${BASE}/api/auth/register`, payload).catch(e => e.response);
    
    // Allow 400 if user already exists from a previous test run
    assert.ok(res.status === 200 || res.status === 201 || res.status === 400, "Should return success or user exists");
    console.log("PASS: Test 1 /api/auth/register\n");
    passed++;
  } catch(e) { 
    console.log("FAIL: Test 1 -", e.message); 
    failed++; 
  }

  try {
    console.log("Test 2: POST /api/auth/login");
    const payload = { email: "test@careernavigator.dev", password: "TestPass123!" };
    const res = await axios.post(`${BASE}/api/auth/login`, payload);
    assert.ok(res.status === 200, "Should login successfully");
    assert.ok(res.data.token, "Response should contain token");
    token = res.data.token;
    console.log("PASS: Test 2 /api/auth/login\n");
    passed++;
  } catch(e) { 
    console.log("FAIL: Test 2 -", e.message); 
    failed++; 
  }

  try {
    console.log("Test 3: GET /api/assessment/questions");
    // Ensure both header possibilities are covered based on typical Express setups
    const res = await axios.get(`${BASE}/api/assessment/questions`, { 
        headers: { 'x-auth-token': token, 'Authorization': `Bearer ${token}` }
    });
    assert.ok(res.status === 200, "Should GET assessment");
    assert.ok(Array.isArray(res.data), "Should return array");
    assert.strictEqual(res.data.length, 30, "Should return exactly 30 questions");
    console.log("PASS: Test 3 /api/assessment\n");
    passed++;
  } catch(e) { 
    console.log("FAIL: Test 3 -", e.message); 
    if(e.response) console.log(e.response.data);
    failed++; 
  }

  try {
    console.log("Test 4: POST /api/careers/match");
    const payload = { 
        riasec_scores: {R:70,I:85,A:30,S:60,E:40,C:50}, 
        narrative: "I love analyzing data with Python and building machine learning models.", 
        north_star: "" 
    };
    const res = await axios.post(`${BASE}/api/careers/match`, payload, { 
        headers: { 'x-auth-token': token, 'Authorization': `Bearer ${token}` }
    });
    assert.ok(res.status === 200, "Should return 200");
    const data = res.data;
    assert.ok(data.top_careers && data.top_careers.length >= 1, "Must have at least 1 career");
    
    const first = data.top_careers[0];
    assert.ok(first.title !== undefined, "Has title");
    assert.ok(first.score !== undefined, "Has score");
    assert.ok(first.rvi !== undefined, "Has rvi");
    assert.ok(first.shap_values !== undefined, "Has shap_values");
    assert.ok(first.justification !== undefined, "Has justification");
    assert.ok(data.next_step !== undefined, "Has next_step");
    console.log("PASS: Test 4 /api/careers/match\n");
    passed++;
  } catch(e) { 
    console.log("FAIL: Test 4 -", e.message); 
    if(e.response && e.response.data) console.log(e.response.data);
    failed++; 
  }

  if (failed === 0) {
     console.log("ALL TESTS PASSED");
  } else {
     console.log(`${failed} TESTS FAILED`);
     process.exit(1);
  }
}

runTests();

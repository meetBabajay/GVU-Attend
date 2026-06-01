const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (err) => { reject(err); });
    if (postData) { req.write(JSON.stringify(postData)); }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING REPORTING & STATISTICS VERIFICATION TESTS ---');

  // Step 1: Login Lecturer
  console.log('\n[Setup] Authenticating Lecturer...');
  let lecturerToken = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'lecturer@computing.edu.ng', password: 'password123' });
    lecturerToken = res.body.token;
    console.log('  Token acquired.');
  } catch (err) {
    console.error('  Lecturer login failed:', err.message);
    return;
  }

  const courseId = 'c1111111-1111-1111-1111-111111111111'; // CSC301 Course ID

  // Test 1: Lecturer Dashboard Stats
  console.log('\n[Test 1] Fetching Lecturer Dashboard Summary...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/reports/dashboard', method: 'GET',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Dashboard Data:', res.body);
  } catch (err) {
    console.error('Test 1 failed:', err.message);
  }

  // Test 2: Course Reporting (CSC301)
  console.log('\n[Test 2] Fetching Course Attendance Report (CSC301)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/reports/course/${courseId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Course Details:', res.body.course);
    console.log('Course Stats Summary:', res.body.stats);
    console.log('Student List:');
    res.body.report.forEach(row => {
      console.log(`  - ${row.fullName} (${row.matricNumber}): ${row.attended}/${row.total} (${row.percentage}%) - Risk: ${row.riskStatus}`);
    });
  } catch (err) {
    console.error('Test 2 failed:', err.message);
  }

  // Test 3: CSV Export
  console.log('\n[Test 3] Fetching Course Report as CSV (Export)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/reports/course/${courseId}/export-csv`, method: 'GET',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('CSV Content Snippet (first 4 lines):');
    const lines = res.body.split('\n').slice(0, 4);
    lines.forEach(line => console.log('  ', line));
  } catch (err) {
    console.error('Test 3 failed:', err.message);
  }

  console.log('\n--- REPORTING & STATISTICS TESTS COMPLETED ---');
};

runTests();

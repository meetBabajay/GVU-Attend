const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING AUTHENTICATION VERIFICATION TESTS ---');

  // Test 1: Health Check
  console.log('\n[Test 1] Health Check...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Health check failed:', err.message);
    return;
  }

  // Test 2: Login Lecturer
  console.log('\n[Test 2] Login Lecturer (Admin)...');
  let lecturerToken = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'lecturer@computing.edu.ng',
      password: 'password123'
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
    lecturerToken = res.body.token;
  } catch (err) {
    console.error('Lecturer login failed:', err.message);
  }

  // Test 3: Login Student
  console.log('\n[Test 3] Login Student...');
  let studentToken = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'cs_student1@computing.edu.ng',
      password: 'password123'
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
    studentToken = res.body.token;
  } catch (err) {
    console.error('Student login failed:', err.message);
  }

  // Test 4: Retrieve Lecturer Profile via /me
  console.log('\n[Test 4] Get /me for Lecturer...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${lecturerToken}`
      }
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Lecturer profile lookup failed:', err.message);
  }

  // Test 5: Retrieve Student Profile via /me
  console.log('\n[Test 5] Get /me for Student (should join department)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Student profile lookup failed:', err.message);
  }

  // Test 6: Lecturer registers a new Student
  console.log('\n[Test 6] Lecturer registers a new Student...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register-student',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lecturerToken}`
      }
    }, {
      email: 'new_cs_student@computing.edu.ng',
      password: 'newpassword123',
      matricNumber: 'CSC/19/9999',
      fullName: 'David Beckham',
      departmentId: 'd1111111-1111-1111-1111-111111111111', // Computer Science
      level: 300
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Student registration failed:', err.message);
  }

  // Test 7: Student attempts to register another Student (should be rejected)
  console.log('\n[Test 7] Student attempts to register another Student (unauthorized check)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register-student',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, {
      email: 'hacker_student@computing.edu.ng',
      password: 'password123',
      matricNumber: 'CSC/19/6666',
      fullName: 'Hacker Joe',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      level: 300
    });
    console.log(`Status: ${res.status}`);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Unauthorized registration check failed:', err.message);
  }

  console.log('\n--- VERIFICATION TESTS COMPLETED ---');
};

runTests();

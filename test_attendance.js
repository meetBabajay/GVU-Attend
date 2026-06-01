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
  console.log('--- STARTING ANTI-FRAUD ATTENDANCE VERIFICATION TESTS ---');

  // Step 1: Logins
  console.log('\n[Setup] Authenticating users...');
  let tokens = {};
  let ids = {};
  
  const users = [
    { name: 'lecturer', email: 'lecturer@computing.edu.ng' },
    { name: 'alice', email: 'cs_student1@computing.edu.ng' },
    { name: 'bob', email: 'se_student2@computing.edu.ng' },
    { name: 'david', email: 'acct_student4@management.edu.ng' }
  ];

  for (const user of users) {
    try {
      const res = await makeRequest({
        hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: user.email, password: 'password123' });
      tokens[user.name] = res.body.token;
      ids[user.name] = res.body.user.role === 'student' ? res.body.user.studentProfile.id : res.body.user.id;
      console.log(`  Token acquired for ${user.name}`);
    } catch (err) {
      console.error(`  Setup failed: Login failed for ${user.name}:`, err.message);
      return;
    }
  }

  const activeSessionId = 'cs444444-4444-4444-4444-444444444444'; // Active CSC301 session

  // Step 2: Lecturer fetches current active QR token
  console.log('\n[Setup] Lecturer fetches current dynamic QR token...');
  let qrToken = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/sessions/${activeSessionId}/qr`, method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.lecturer}` }
    });
    qrToken = res.body.qrToken;
    console.log('  QR Token generated successfully.');
  } catch (err) {
    console.error('  Failed to get QR Token:', err.message);
    return;
  }

  // Test 1: Department restriction check (David - Accounting student trying to sign CSC301)
  console.log('\n[Test 1] David (Accounting Student) attempts to sign CSC301 attendance...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.david}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: qrToken,
      latitude: 6.42806200,
      longitude: 3.42194300,
      deviceFingerprint: 'device_david_pc'
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 1 failed:', err.message);
  }

  // Test 2: Geofencing restriction check (Alice - CS student, signing from 10km away)
  console.log('\n[Test 2] Alice attempts to sign from outside allowed radius (10km away)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: qrToken,
      latitude: 6.52806200, // Spoofed latitude (10km away)
      longitude: 3.52194300, // Spoofed longitude
      deviceFingerprint: 'device_alice_phone'
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 2 failed:', err.message);
  }

  // Test 3: QR expiration check (Alice signs with a corrupted/expired token)
  console.log('\n[Test 3] Alice attempts to sign with invalid/expired QR code...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: 'invalid_expired_token_mock_string',
      latitude: 6.42806200,
      longitude: 3.42194300,
      deviceFingerprint: 'device_alice_phone'
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 3 failed:', err.message);
  }

  // Test 4: Successful Submission (Alice signs in range with valid credentials)
  console.log('\n[Test 4] Alice signs attendance with valid parameters (inside radius, valid QR)...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: qrToken,
      latitude: 6.42806200, // exact Computing Lab 1 coordinates
      longitude: 3.42194300,
      deviceFingerprint: 'device_alice_phone'
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 4 failed:', err.message);
  }

  // Test 5: Device sharing control (Bob attempts proxy signing using Alice's device fingerprint)
  console.log('\n[Test 5] Bob attempts proxy signing using Alice\'s device fingerprint...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.bob}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: qrToken,
      latitude: 6.42806200,
      longitude: 3.42194300,
      deviceFingerprint: 'device_alice_phone' // Copied Alice's device fingerprint
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 5 failed:', err.message);
  }

  // Test 6: Successful Submission (Bob signs using his own device fingerprint)
  console.log('\n[Test 6] Bob signs attendance using his own device fingerprint...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.bob}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: qrToken,
      latitude: 6.42806200,
      longitude: 3.42194300,
      deviceFingerprint: 'device_bob_phone' // Bob's own device fingerprint
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 6 failed:', err.message);
  }

  // Test 7: Double submission check (Alice tries to sign a second time)
  console.log('\n[Test 7] Alice attempts to sign attendance a second time...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/attendance/submit', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      }
    }, {
      classSessionId: activeSessionId,
      qrToken: qrToken,
      latitude: 6.42806200,
      longitude: 3.42194300,
      deviceFingerprint: 'device_alice_phone'
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 7 failed:', err.message);
  }

  // Test 8: Lecturer lists session attendance list
  console.log('\n[Test 8] Lecturer fetches session attendance list...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/attendance/session/${activeSessionId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.lecturer}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Attendees:', res.body.map(r => `${r.student.fullName} (${r.student.matricNumber}) - GPS Verified: ${r.verifiedGps}, Distance: ${r.distanceMeters}m`));
  } catch (err) {
    console.error('Test 8 failed:', err.message);
  }

  // Test 9: Student fetches their personal history
  console.log('\n[Test 9] Student (Alice) fetches their personal history log...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/attendance/student/${ids.alice}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.alice}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Logs:', res.body.map(r => `${r.session.sessionName} (${r.session.date}) - Status: ${r.status}`));
  } catch (err) {
    console.error('Test 9 failed:', err.message);
  }

  // Test 10: Student fetches their course attendance percentage
  console.log('\n[Test 10] Student (Alice) fetches course stats/percentage for CSC301...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/attendance/student-stats/course/c1111111-1111-1111-1111-111111111111`, method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.alice}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Stats:', res.body);
  } catch (err) {
    console.error('Test 10 failed:', err.message);
  }

  console.log('\n--- ANTI-FRAUD ATTENDANCE TESTS COMPLETED ---');
};

runTests();

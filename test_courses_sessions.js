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
  console.log('--- STARTING COURSES & SESSIONS VERIFICATION TESTS ---');

  // Step 1: Login Lecturer
  console.log('\n[Setup] Login Lecturer...');
  let lecturerToken = '';
  let lecturerId = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'lecturer@computing.edu.ng', password: 'password123' });
    lecturerToken = res.body.token;
    lecturerId = res.body.user.id;
    console.log('Lecturer login token acquired.');
  } catch (err) {
    console.error('Setup failed: Lecturer login failed:', err.message);
    return;
  }

  // Step 2: Login Student (Alice)
  console.log('\n[Setup] Login Student...');
  let studentToken = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'cs_student1@computing.edu.ng', password: 'password123' });
    studentToken = res.body.token;
    console.log('Student login token acquired.');
  } catch (err) {
    console.error('Setup failed: Student login failed:', err.message);
    return;
  }

  // Test 1: Lecturer List Courses
  console.log('\n[Test 1] Lecturer lists their taught courses...');
  let course1Id = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/courses', method: 'GET',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Courses:', res.body.map(c => `${c.courseCode} - ${c.courseTitle}`));
    course1Id = res.body[0].id; // CSC301 ID
  } catch (err) {
    console.error('Test 1 failed:', err.message);
  }

  // Test 2: Student List Courses (enrolled ones)
  console.log('\n[Test 2] Student lists their enrolled courses...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/courses', method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Enrolled Courses:', res.body.map(c => `${c.courseCode} - ${c.courseTitle}`));
  } catch (err) {
    console.error('Test 2 failed:', err.message);
  }

  // Test 3: Lecturer Creates a Course
  console.log('\n[Test 3] Lecturer creates a new course (CSC501)...');
  let newCourseId = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lecturerToken}`
      }
    }, {
      courseCode: 'CSC501',
      courseTitle: 'Advanced Distributed Systems',
      departmentId: 'd1111111-1111-1111-1111-111111111111', // Computer Science
      level: 500
    });
    console.log(`Status: ${res.status}`);
    console.log('Created Course:', res.body.course.courseCode, res.body.course.id);
    newCourseId = res.body.course.id;
  } catch (err) {
    console.error('Test 3 failed:', err.message);
  }

  // Test 4: Batch Enroll Students into CSC501 (testing department restriction)
  console.log('\n[Test 4] Lecturer batch enrolls students into CSC501...');
  console.log('Enrolling: Alice (CS, Allowed), Bob (SE, Allowed), David (Accounting, Forbidden)');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/courses/${newCourseId}/enroll`, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lecturerToken}`
      }
    }, {
      matricNumbers: ['CSC/19/1001', 'SEN/19/2002', 'ACC/19/4004']
    });
    console.log(`Status: ${res.status}`);
    console.log('Result Summary:');
    console.log('  Enrolled:', res.body.enrolled);
    console.log('  Failures/Warnings:', res.body.failures);
  } catch (err) {
    console.error('Test 4 failed:', err.message);
  }

  // Test 5: List Sessions for CSC301
  console.log('\n[Test 5] List sessions for CSC301...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/sessions/course/${course1Id}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Sessions:', res.body.map(s => `${s.sessionName} (${s.date}) - Active: ${s.isActive}`));
  } catch (err) {
    console.error('Test 5 failed:', err.message);
  }

  // Test 6: Create Session for CSC301
  console.log('\n[Test 6] Lecturer creates new session for CSC301...');
  let newSessionId = '';
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/sessions/course/${course1Id}`, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lecturerToken}`
      }
    }, {
      sessionName: 'Session 5 - Virtual Memory',
      date: '2026-06-05',
      startTime: '09:00:00',
      endTime: '11:00:00',
      roomLocation: 'Computing Lab 1',
      latitude: 6.42806200,
      longitude: 3.42194300,
      allowedRadiusMeters: 50
    });
    console.log(`Status: ${res.status}`);
    console.log('Created Session:', res.body.session.sessionName, res.body.session.id);
    newSessionId = res.body.session.id;
  } catch (err) {
    console.error('Test 6 failed:', err.message);
  }

  // Test 7: Open Session (toggles isActive and generates qrSecretSalt)
  console.log('\n[Test 7] Lecturer opens attendance session...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/sessions/open/${newSessionId}`, method: 'POST',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 7 failed:', err.message);
  }

  // Test 8: Close Session (toggles isActive to false)
  console.log('\n[Test 8] Lecturer closes attendance session...');
  try {
    const res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/sessions/close/${newSessionId}`, method: 'POST',
      headers: { 'Authorization': `Bearer ${lecturerToken}` }
    });
    console.log(`Status: ${res.status}`);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Test 8 failed:', err.message);
  }

  console.log('\n--- COURSES & SESSIONS VERIFICATION TESTS COMPLETED ---');
};

runTests();

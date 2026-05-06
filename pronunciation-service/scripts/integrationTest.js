const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API = process.env.API_URL || 'http://localhost:3000/api/v1';

function extractCookie(setCookie) {
  if (!setCookie) return '';
  if (Array.isArray(setCookie)) return setCookie.map(s => s.split(';')[0]).join('; ');
  return String(setCookie).split(';')[0];
}

async function main() {
  try {
    const testUser = { username: 'itestuser', email: 'itest@example.com', password: 'Password123!' };

    console.log('Registering user...');
    await axios.post(`${API}/auth/register`, testUser).catch(() => {});

    console.log('Logging in...');
    const loginRes = await axios.post(
      `${API}/auth/login`,
      { emailOrUsername: testUser.email, password: testUser.password },
      { validateStatus: () => true }
    );

    console.log('Login status', loginRes.status);
    console.log('Login body:', loginRes.data);

    const accessToken = loginRes.data?.data?.accessToken;
    const setCookie = loginRes.headers['set-cookie'];
    const cookie = extractCookie(setCookie);

    console.log('Cookie from login:', cookie);

    console.log('Refreshing token via cookie...');
    const refreshRes = await axios.post(
      `${API}/auth/refresh`,
      {},
      { headers: { Cookie: cookie }, validateStatus: () => true }
    );

    console.log('Refresh status', refreshRes.status);
    console.log('Refresh body', refreshRes.data);

    const newAccess = refreshRes.data?.data?.accessToken || accessToken;
    const refreshCookie = extractCookie(refreshRes.headers['set-cookie']) || cookie;

    // prepare sample audio file
    const samplePath = __dirname + '/sample.wav';
    if (!fs.existsSync(samplePath)) fs.writeFileSync(samplePath, 'SAMPLE AUDIO BYTES');

    console.log('Uploading audio to pronunciation evaluate-audio...');
    const form = new FormData();
    form.append('word', 'hello');
    form.append('expectedText', 'hello');
    form.append('audio', fs.createReadStream(samplePath));

    const headers = Object.assign({}, form.getHeaders());
    if (newAccess) headers['Authorization'] = `Bearer ${newAccess}`;
    if (refreshCookie) headers['Cookie'] = refreshCookie;

    const evalRes = await axios.post(`${API}/pronunciation/evaluate-audio`, form, { headers, maxContentLength: Infinity, maxBodyLength: Infinity, validateStatus: () => true });

    console.log('Evaluate-audio status', evalRes.status);
    console.log('Evaluate-audio body:', JSON.stringify(evalRes.data, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Integration test error:', err.message || err);
    if (err.response) console.error('Response data:', err.response.data);
    process.exit(1);
  }
}

main();

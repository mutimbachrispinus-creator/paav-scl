const fetch = require('node-fetch');
setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:8788/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username: 'admin', password: 'password' })
    });
    const text = await res.text();
    console.log('HTTP', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
  process.exit(0);
}, 6000);

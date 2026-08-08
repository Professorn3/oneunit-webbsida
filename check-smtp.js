async function check() {
  const adminAuthRes = await fetch('http://192.168.1.157:8095/api/admins/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'info@oneunit.se', password: 'Ilkylie7012' })
  });
  const authData = await adminAuthRes.json();
  const token = authData.token;

  const settingsRes = await fetch('http://192.168.1.157:8095/api/settings', {
    headers: { 'Authorization': token }
  });
  const settings = await settingsRes.json();
  console.log(settings);
}
check();

const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://restaurant-erp-backend-production.up.railway.app/api/v1/auth/login', {
      usernameOrEmailOrMobile: 'jai',
      password: 'password' // or try other passwords if it fails
    });
    const token = res.data.data.token;
    console.log("Logged in!");

    const billsRes = await axios.get('https://restaurant-erp-backend-production.up.railway.app/api/v1/bills?size=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Bills:", JSON.stringify(billsRes.data.data.content, null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();

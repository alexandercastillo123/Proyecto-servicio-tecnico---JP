const axios = require('axios');

const pk = 'pk_test_Q7byV7qjU6Jpn0jv';
const sk = 'sk_test_AkwtAL7LwriNndnn';

async function testCulqi() {
  try {
    console.log("Tokenizing card...");
    // 1. Tokenize
    const tokenRes = await axios.post('https://secure.culqi.com/v2/tokens', {
      card_number: '4111111111111111',
      cvv: '123',
      expiration_month: '12',
      expiration_year: '2028',
      email: 'test@test.com'
    }, {
      headers: { 'Authorization': `Bearer ${pk}` }
    });
    
    const token = tokenRes.data.id;
    console.log("Token received:", token);

    // 2. Charge
    console.log("Charging...");
    const chargeRes = await axios.post('https://api.culqi.com/v2/charges', {
      amount: 15000,
      currency_code: 'PEN',
      email: 'test@test.com',
      source_id: token,
      capture: true,
      description: 'Test Charge'
    }, {
      headers: { 'Authorization': `Bearer ${sk}` }
    });

    console.log("Charge success:", chargeRes.data.id);
  } catch (error) {
    console.error("Culqi Error:", error.response?.data || error.message);
  }
}

testCulqi();

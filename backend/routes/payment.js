const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// MTN MoMo Credentials - Replace with your actual keys
const SUBSCRIPTION_KEY = '0b86921990a446c4981a87c9bb0a329a';
const API_USER_ID = '021e9e6a-36d5-4c97-a3f1-7d20e593f67c';
const API_KEY = '45b3683df299429c9c883cd41884a045';
const TARGET_ENVIRONMENT = 'sandbox';
const BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
async function getAccessToken() {
  const authString = `${API_USER_ID}:${API_KEY}`;
  const base64Auth = Buffer.from(authString).toString('base64');
  
  const response = await axios.post(
    `${BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'X-Target-Environment': TARGET_ENVIRONMENT
      }
    }
  );
  return response.data.access_token;
}

router.post('/request', async (req, res) => {
  try {
    const { amount, phoneNumber, orderId } = req.body;
    
    if (!amount || !phoneNumber || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '250' + phoneNumber.substring(1);
    }
    
    const token = await getAccessToken();
    const referenceId = uuidv4();
    
    await axios.post(
      `${BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: 'RWF',
        externalId: orderId.toString(),
        payer: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone
        },
        payerMessage: `Payment for order ${orderId}`,
        payeeNote: 'MyCare+ purchase'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({ success: true, referenceId });
  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Payment request failed' });
  }
});

router.get('/status/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;
    const token = await getAccessToken();
    
    const response = await axios.get(
      `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
        }
      }
    );
    
    res.json({ status: response.data.status });
  } catch (error) {
    res.status(500).json({ status: 'FAILED' });
  }
});

module.exports = router;
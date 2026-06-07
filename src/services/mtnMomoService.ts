import axios from 'axios';
import uuid from 'react-native-uuid';
import {
    MTN_SUBSCRIPTION_KEY,
    MTN_API_USER_ID,
    MTN_API_KEY


} from '@env';

// Your MTN MoMo API Keys
const SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const API_USER_ID = process.env.MTN_API_USER_ID;
const API_KEY = process.env.MTN_API_KEY;
const TARGET_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'mtnrwanda' : 'sandbox';
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://proxy.momoapi.mtn.com' 
  : 'https://sandbox.momodeveloper.mtn.com';

// Step 1: Get Access Token
export const getAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          'X-Reference-Id': API_USER_ID,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
          'X-Target-Environment': TARGET_ENVIRONMENT
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Step 2: Request Payment from Customer
export const requestPayment = async (
  amount: number,
  phoneNumber: string,
  orderId: string
): Promise<{ referenceId: string; success: boolean }> => {
  try {
    const token = await getAccessToken();
    const referenceId = uuid.v4() as string;
    
    // Format phone number (remove leading 0 if present)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '250' + phoneNumber.substring(1);
    }
    
    const response = await axios.post(
      `${BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency: 'RWF',
        externalId: orderId,
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
    
    return { referenceId, success: response.status === 202 };
  } catch (error) {
    console.error('Error requesting payment:', error);
    return { referenceId: '', success: false };
  }
};

// Step 3: Check Payment Status
export const checkPaymentStatus = async (referenceId: string): Promise<string> => {
  try {
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
    return response.data.status; // 'PENDING', 'SUCCESSFUL', or 'FAILED'
  } catch (error) {
    console.error('Error checking payment status:', error);
    return 'FAILED';
  }
};
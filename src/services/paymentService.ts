const BACKEND_URL = 'http://localhost:3000'; // Use your computer's IP for phone testing

export const requestMTNPayment = async (amount: number, phoneNumber: string, orderId: number) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        phoneNumber,
        orderId,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment request error:', error);
    return { success: false, error: 'Network error' };
  }
};

export const checkPaymentStatus = async (referenceId: string): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/payment/status/${referenceId}`);
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Status check error:', error);
    return 'FAILED';
  }
};
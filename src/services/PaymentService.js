// src/services/PaymentService.js

// Replace with your computer's local IP address for phone testing
// Run 'ipconfig' on Windows to find it (e.g., 192.168.1.100)
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';

export const initiatePayment = async (phoneNumber, amount) => {
    try {
        const response = await fetch(`${API_BASE_URL}/initiate-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneNumber, amount: amount })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Initiate payment error:", error);
        return { success: false, error: error.message };
    }
};
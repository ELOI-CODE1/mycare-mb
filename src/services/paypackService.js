// src/services/paypackService.js

// Using your actual Wi-Fi IP address so your phone can reach your computer
const BACKEND_URL = "http://192.168.0.110:3000/api"; 

export async function initiatePayment(phone, amount) {
  try {
    const response = await fetch(`${BACKEND_URL}/initiate-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        amount: amount
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Payment failed");
    }
    
    return data; // Returns { success: true, reference: "...", message: "..." }
  } catch (error) {
    console.error("Payment initiation failed:", error);
    throw error;
  }
}
import express from 'express';

const router = express.Router();

function getPayPalBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'ARXtn1vEQf6ZuOY-N0y6HSoQ7IjkEOrEdnyteXwk_0PmuJfdc5xJ2C49TxR0VJAU71xOb9n8kTyzTtBD';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EJY0jWl4F_wwstSEOm3dZ3hZV_Wh_vpDkCDWtRXpTPpg1IA0jlR3D_YY1Vx-bKrABexrgyzpWPkaHV-8';

async function getPayPalAccessToken(): Promise<string> {
  const baseUrl = getPayPalBaseUrl();
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'PayPal auth failed');
  }
  return data.access_token;
}

// Create PayPal order (no auth required - PayPal handles payment security)
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'EUR' } = req.body;
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: parseFloat(amount).toFixed(2),
            },
          },
        ],
      }),
    });

    const order = await response.json();
    res.json(order);
  } catch (error: any) {
    console.error('PayPal create-order error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to create PayPal order' });
  }
});

// Capture PayPal payment
router.post('/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await response.json();
    res.json(capture);
  } catch (error: any) {
    console.error('PayPal capture-order error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Failed to capture PayPal payment' });
  }
});

// Get PayPal client ID (for frontend SDK)
router.get('/client-id', (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID, mode: process.env.PAYPAL_MODE || 'sandbox' });
});

export default router;

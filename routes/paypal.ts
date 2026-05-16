import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// Create PayPal order
router.post('/create-order', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount, currency = 'EUR' } = req.body;
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
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
  } catch (error) {
    console.error('PayPal create-order error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// Capture PayPal payment
router.post('/capture-order', authenticate, async (req: AuthRequest, res) => {
  try {
    const { orderID } = req.body;
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await response.json();
    res.json(capture);
  } catch (error) {
    console.error('PayPal capture-order error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal payment' });
  }
});

// Get PayPal client ID (for frontend SDK)
router.get('/client-id', (req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID, mode: PAYPAL_MODE });
});

export default router;

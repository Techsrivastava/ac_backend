import { Router } from 'express';
import { env } from '../src/config/env.js';
import { asyncHandler } from '../src/utils/asyncHandler.js';
import { ApiError } from '../src/utils/ApiError.js';

const router = Router();

function getPayPalBaseUrl(): string {
  return env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(): Promise<string> {
  const baseUrl = getPayPalBaseUrl();
  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
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

// Create PayPal order
router.post('/create-order', asyncHandler(async (req, res) => {
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
  if (!response.ok) {
    throw ApiError.internal('Failed to create PayPal order');
  }

  res.json({ success: true, data: order });
}));

// Capture PayPal payment
router.post('/capture-order', asyncHandler(async (req, res) => {
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
  if (!response.ok) {
    throw ApiError.internal('Failed to capture PayPal payment');
  }

  res.json({ success: true, data: capture });
}));

// Get PayPal client ID (for frontend SDK)
router.get('/client-id', (req, res) => {
  res.json({
    success: true,
    clientId: env.PAYPAL_CLIENT_ID,
    mode: env.PAYPAL_MODE
  });
});

export default router;

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// POST /api/payments/create-intent
router.post('/create-intent', authenticate, async (req, res) => {
  const { booking_id, payment_type = 'full' } = req.body; // payment_type: 'full' | 'deposit'

  try {
    const booking = await db.query(
      `SELECT b.*, s.name as service_name, s.price, u.email, u.first_name, u.last_name
       FROM bookings b JOIN services s ON b.service_id = s.id JOIN users u ON b.customer_id = u.id
       WHERE b.id = $1`,
      [booking_id]
    );

    if (!booking.rows[0]) return res.status(404).json({ error: 'Booking not found' });

    const b = booking.rows[0];
    const amount = payment_type === 'deposit'
      ? Math.round(b.price * 0.2 * 100) // 20% deposit
      : Math.round(b.price * 100);

    // Create or retrieve Stripe customer
    let stripeCustomerId = b.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: b.email,
        name: `${b.first_name} ${b.last_name}`,
        metadata: { user_id: b.customer_id },
      });
      stripeCustomerId = customer.id;
      await db.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [stripeCustomerId, b.customer_id]);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'nzd',
      customer: stripeCustomerId,
      metadata: {
        booking_id: booking_id,
        payment_type,
        service: b.service_name,
      },
      description: `${b.service_name} - Booking #${booking_id}`,
      receipt_email: b.email,
    });

    // Save payment record
    await db.query(`
      INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, currency, payment_type, status)
      VALUES ($1, $2, $3, 'NZD', $4, 'pending')
      ON CONFLICT (booking_id) DO UPDATE SET
        stripe_payment_intent_id = $2, amount = $3, payment_type = $4
    `, [booking_id, paymentIntent.id, amount / 100, payment_type]);

    res.json({
      client_secret: paymentIntent.client_secret,
      amount: amount / 100,
      currency: 'NZD',
      payment_type,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const bookingId = pi.metadata.booking_id;

      await db.query(`
        UPDATE payments SET status = 'completed', paid_at = NOW() WHERE stripe_payment_intent_id = $1
      `, [pi.id]);

      await db.query(`
        UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1
      `, [bookingId]);

      // Send confirmation email (async, non-blocking)
      sendBookingConfirmation(bookingId).catch(console.error);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await db.query(`
        UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = $1
      `, [pi.id]);
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object;
      await db.query(`
        UPDATE payments SET status = 'refunded', refunded_at = NOW() WHERE stripe_payment_intent_id = $1
      `, [charge.payment_intent]);
      break;
    }
  }

  res.json({ received: true });
});

// POST /api/payments/refund
router.post('/refund', authenticate, async (req, res) => {
  const { booking_id, reason } = req.body;

  try {
    const payment = await db.query(
      'SELECT * FROM payments WHERE booking_id = $1 AND status = $2',
      [booking_id, 'completed']
    );

    if (!payment.rows[0]) return res.status(404).json({ error: 'No completed payment found' });

    const refund = await stripe.refunds.create({
      payment_intent: payment.rows[0].stripe_payment_intent_id,
      reason: reason || 'requested_by_customer',
    });

    await db.query(`
      UPDATE payments SET status = 'refunded', refunded_at = NOW() WHERE booking_id = $1
    `, [booking_id]);

    await db.query(`
      UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1
    `, [booking_id]);

    res.json({ refund, message: 'Refund processed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/voucher/purchase
router.post('/voucher/purchase', authenticate, async (req, res) => {
  const { amount, recipient_name, recipient_email, message } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'nzd',
      metadata: { type: 'gift_voucher', purchaser_id: req.user.id },
    });

    const code = generateVoucherCode();

    await db.query(`
      INSERT INTO gift_vouchers (code, amount, purchaser_id, recipient_name, recipient_email, message, stripe_payment_intent_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [code, amount, req.user.id, recipient_name, recipient_email, message, paymentIntent.id]);

    res.json({ client_secret: paymentIntent.client_secret, voucher_code: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'LUXE-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function sendBookingConfirmation(bookingId) {
  // Implementation: send email via nodemailer
  console.log(`📧 Sending confirmation for booking ${bookingId}`);
}

module.exports = router;

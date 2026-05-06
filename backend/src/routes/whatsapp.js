// whatsapp.js
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/qr', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const waLink = `https://wa.me/${process.env.WHATSAPP_PHONE_ID}`;
    const qrDataUrl = await QRCode.toDataURL(waLink);
    res.json({ qr: qrDataUrl, link: waLink });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/send', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { phone, message, template } = req.body;
  try {
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: template ? 'template' : 'text',
        text: template ? undefined : { body: message },
        template: template,
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

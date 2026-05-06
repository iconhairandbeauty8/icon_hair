import express, { Request, Response } from 'express';
import QRCode from 'qrcode';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/qr', authenticate, authorize('admin', 'manager'), async (_req: Request, res: Response) => {
  try {
    const waLink = `https://wa.me/${process.env.WHATSAPP_PHONE_ID}`;
    const qrDataUrl = await QRCode.toDataURL(waLink);
    res.json({ qr: qrDataUrl, link: waLink });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/send', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { phone, message, template } = req.body as { phone: string; message: string; template?: object };
  try {
    const response = await fetch(`${process.env.WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: template ? 'template' : 'text',
        text: template ? undefined : { body: message },
        template,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;

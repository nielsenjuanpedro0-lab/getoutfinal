// api/mp-webhook.js
// Webhook para recibir notificaciones de pago de MercadoPago
// MercadoPago llama a esta URL directamente cuando un pago es aprobado

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key para escribir desde el servidor
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // MercadoPago envía un GET de validación al registrar el webhook
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    // Solo procesar notificaciones de pagos
    if (type !== 'payment') {
      return res.status(200).json({ status: 'ignored', type });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(400).json({ error: 'No payment ID in notification' });
    }

    const MP_ACCESS_TOKEN = process.env.VITE_MP_ACCESS_TOKEN;

    // Consultar el detalle del pago a la API de MercadoPago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    const payment = await mpResponse.json();

    console.log(`Webhook MP: pago ${paymentId} - status: ${payment.status} - ref: ${payment.external_reference}`);

    if (payment.status === 'approved') {
      const bookingId = payment.external_reference;

      if (!bookingId) {
        console.error('Pago aprobado pero sin external_reference:', paymentId);
        return res.status(200).json({ status: 'no_reference' });
      }

      // Actualizar la reserva en Supabase
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'paid',
          payment_status: 'paid',
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error actualizando reserva en Supabase:', error);
        return res.status(500).json({ error: 'Error updating booking' });
      }

      console.log(`Reserva ${bookingId} confirmada automáticamente.`);
      return res.status(200).json({ status: 'ok', bookingId });
    }

    // Para otros estados (pending, rejected) simplemente responder OK
    return res.status(200).json({ status: 'ok', payment_status: payment.status });

  } catch (error) {
    console.error('Error en webhook MP:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

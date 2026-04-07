// api/mercadopago.js
// Vercel Serverless Function to handle Mercado Pago Preferences

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { bookingId, roomName, price } = req.body
    const MP_ACCESS_TOKEN = process.env.VITE_MP_ACCESS_TOKEN || 'APP_USR-7014353175635252-021115-9fe15c0f4480265d0ce963f0928097d4-438327400'

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Seña - ${roomName}`,
            description: `Reserva para la sala ${roomName}`,
            quantity: 1,
            currency_id: "ARS",
            unit_price: price,
          },
        ],
        external_reference: bookingId,
        back_urls: {
          success: `${req.headers.origin || 'https://getoutnecochea.com.ar'}/?status=success`,
          failure: `${req.headers.origin || 'https://getoutnecochea.com.ar'}/?status=failure`,
          pending: `${req.headers.origin || 'https://getoutnecochea.com.ar'}/?status=pending`,
        },
        auto_return: "approved",
      }),
    });

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error creating MP preference')
    }

    return res.status(200).json({ init_point: data.init_point })

  } catch (error) {
    console.error("Error in mercadopago API:", error.message)
    return res.status(400).json({ error: error.message })
  }
}

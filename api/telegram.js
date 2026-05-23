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
    const { nombre, habitacion, fecha, hora, telefono } = req.body;
    
    // Estos valores vendrán de las variables de entorno configuradas en Vercel
    const token = process.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.VITE_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: 'Credenciales de Telegram no configuradas' });
    }

    const text = `🚨 *NUEVO TURNO PENDIENTE*\n\n👤 *Cliente:* ${nombre}\n📞 *WhatsApp:* ${telefono}\n🧩 *Sala:* ${habitacion}\n📅 *Día:* ${fecha}\n⏰ *Hora:* ${hora}\n\n⚠️ _El turno ha sido pre-agendado. A la espera de que se pague la seña._`;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.description || 'Error al enviar mensaje a Telegram');
    }

    return res.status(200).json({ success: true })

  } catch (error) {
    console.error("Error in telegram API:", error.message)
    return res.status(400).json({ error: error.message })
  }
}

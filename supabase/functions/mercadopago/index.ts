// supabase/functions/mercadopago/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bookingId, roomName, price } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN is not set')
    }

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
          success: `${req.headers.get('origin') || 'https://getoutnecochea.com.ar'}/?status=success`,
          failure: `${req.headers.get('origin') || 'https://getoutnecochea.com.ar'}/?status=failure`,
          pending: `${req.headers.get('origin') || 'https://getoutnecochea.com.ar'}/?status=pending`,
        },
        auto_return: "approved",
      }),
    });

    const data = await response.json()
    console.log("MP Preference created:", data.id)

    return new Response(
      JSON.stringify({ init_point: data.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error in mercadopago function:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

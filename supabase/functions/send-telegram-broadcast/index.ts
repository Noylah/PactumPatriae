import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chat_id, messaggio, topic_id, parse_mode = 'Markdown' } = await req.json()
    
    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN')
    const targetChatId = chat_id || Deno.env.get('TELEGRAM_CHAT_ID')

    if (!targetChatId) {
      throw new Error("Manca l'ID della chat di destinazione")
    }

    const telegramBody: any = {
      chat_id: targetChatId,
      text: messaggio,
      parse_mode: parse_mode
    }

    if (topic_id) {
      telegramBody.message_thread_id = topic_id
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramBody),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
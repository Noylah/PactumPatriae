import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN')
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    let nomeUtente = "Sistema/Sconosciuto"
    if (user) {
      const email = user.email || ""
      nomeUtente = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
    }

    const { messaggio, descrizione } = await req.json()

    const testoTelegram = `🦅 *Pactum Patriae*\nɴᴜᴏᴠᴏ ʟᴏɢ ꜱɪᴛᴏ\n\n👤 *ᴏᴘᴇʀᴀᴛᴏʀᴇ:* ${nomeUtente}\n📝 *ᴀᴢɪᴏɴᴇ:* ${messaggio}\n\n📖 *ᴅᴇᴛᴛᴀɢʟɪ:* _${descrizione}_`

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testoTelegram,
        parse_mode: 'Markdown'
      }),
    })

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
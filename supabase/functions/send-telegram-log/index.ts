import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    })
  }

  try {
    const { messaggio, utente, descrizione } = await req.json()

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

    let testoLog = `🦅 *Pactum Patriae*\nɴᴜᴏᴠᴏ ʟᴏɢ ꜱɪᴛᴏ\n\n👤 *ᴏᴘᴇʀᴀᴛᴏʀᴇ:* ${utente}\n📝 *ᴀᴢɪᴏɴᴇ:* ${messaggio}`
    if (descrizione) {
      testoLog += `\n\n📖 *ᴅᴇᴛᴛᴀɢʟɪ:* _${descrizione}_`
    }
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: testoLog,
        parse_mode: 'Markdown'
      })
    })

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200 
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400 
    })
  }
})
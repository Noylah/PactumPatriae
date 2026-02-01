const TARGET_CHAT_ID = "-1003526824346"; 
const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function inviaLog(messaggio, descrizione = "") {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        await _supabase.functions.invoke('send-telegram-log', {
            body: { messaggio, descrizione }, 
            headers: {
                Authorization: `Bearer ${session?.access_token}`
            }
        });
    } catch (err) {
        console.error("Errore log:", err.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formAffiliati = document.querySelector('.affiliati-form');

    if (formAffiliati) {
        formAffiliati.addEventListener('submit', async function(e) {
            e.preventDefault();

            let nickname = document.getElementById('nickname').value;
            let telegram = document.getElementById('telegram').value;
            const submitBtn = this.querySelector('button');

            const escapeMarkdown = (text) => text.replace(/[_*`[\]()]/g, '\\$&');

            if (telegram && !telegram.startsWith('@')) {
                telegram = '@' + telegram;
            }

            const cleanNickname = escapeMarkdown(nickname);
            const cleanTelegram = escapeMarkdown(telegram);

            submitBtn.disabled = true;
            submitBtn.innerText = "Recupero IP...";

            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                const userIP = ipData.ip;

                const messaggio = `🦅 *Pactum Patriae*\nʀɪᴄʜɪᴇꜱᴛᴀ ᴅɪ ᴀꜰꜰɪʟɪᴀᴢɪᴏɴᴇ ᴛʀᴀᴍɪᴛᴇ ᴡᴇʙ\n\n• 👤 *ᴜꜱᴇʀɴᴀᴍᴇ*: ${cleanNickname}\n• 💬 *ᴛᴇʟᴇɢʀᴀᴍ*: ${cleanTelegram}`;

                submitBtn.innerText = "Invio in corso...";

                const { data, error } = await _supabase.functions.invoke('send-telegram-broadcast', {
                    body: {
                        chat_id: TARGET_CHAT_ID,
                        messaggio: messaggio,
                        topic_id: 113,
                        parse_mode: "Markdown"
                    }
                });

                if (error || (data && !data.ok)) {
                    throw new Error(error?.message || data?.description || "Errore invio");
                }

                inviaLog("Affiliazioni: Nuova richiesta", `User: ${nickname} | IP: ${userIP}`);

                const formBox = document.querySelector('.affiliati-form-box');
                formBox.innerHTML = `
                    <div class="success-message-container">
                        <div class="success-card">
                            <div class="success-icon">✓</div>
                            <h3>Richiesta Inviata!</h3>
                            <p>I dati sono stati inviati con successo.</p>
                        </div>
                    </div>`;

            } catch (error) {
                console.error(error);
                inviaLog("Affiliazioni: Fallimento", `User: ${nickname} | Errore: ${error.message}`);
                alert("Errore durante l'operazione.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Invia Richiesta";
            }
        });
    }
});

async function caricaNotizieHome() {
    const { data: notizie, error } = await _supabase
        .from('notizie')
        .select('*')
        .order('data_comunicato', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Errore caricamento notizie:", error);
        return;
    }

    const grid = document.getElementById('news-grid');
    if (!grid) return;

    if (notizie.length === 0) {
        grid.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; grid-column: 1/-1;">Nessun comunicato presente.</p>';
        return;
    }

    grid.innerHTML = notizie.map(n => {
        const dataFmt = n.data_comunicato 
            ? new Date(n.data_comunicato).toLocaleDateString('it-IT') 
            : "";

        return `
            <div class="news-card" onclick='openDynamicModal(${JSON.stringify(n).replace(/'/g, "&apos;")})'>
                <div class="card-content">
                    <div class="card-top">
                        <span class="card-badge">${n.badge || 'COMUNICATO'}</span>
                        <span class="card-date">${dataFmt}</span>
                    </div>
                    <h3>${n.titolo}</h3>
                    <p>${n.sottotitolo || ''}</p>
                    <span class="read-more">Leggi tutto →</span>
                </div>
            </div>
        `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', caricaNotizieHome);

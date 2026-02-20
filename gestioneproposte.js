const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_AUTORIZZATO = 'Zicli';

let propostaSelezionata = null;

(async function protezioneTotale() {
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
    if (sessionError || !session) {
        window.location.replace('login.html');
        return;
    }
    try {
        const usernameDaCercare = session.user.email.split('@')[0];
        const { data: profilo, error: dbError } = await _supabase
            .from('staff_users')
            .select('permessi')
            .eq('username', usernameDaCercare) 
            .single();

        if (dbError || !profilo) {
            window.location.replace('login.html');
            return;
        }

        const paginaCorrente = window.location.pathname.split('/').pop() || 'index.html';
        const mappePermessi = { 
            'proposte.html': 'P',
            'staff.html': 'C',    
            'riunioni.html': 'R', 
            'bilancio.html': 'E',
            'notizie.html': 'N',
            'credenziali.html': 'A',
            'gestioneproposte.html': 'G'
        };
        
        const letteraNecessaria = mappePermessi[paginaCorrente];
        if (letteraNecessaria && !profilo.permessi.includes(letteraNecessaria)) {
            window.location.replace('staff.html');
            return;
        }

        sessionStorage.setItem('loggedUser', usernameDaCercare);
        sessionStorage.setItem('userPermessi', profilo.permessi);
        document.body.style.visibility = "visible";
        document.body.style.opacity = "1";
        
        caricaTutteLeProposte();
    } catch (err) {
        window.location.replace('login.html');
    }
})();

async function caricaTutteLeProposte() {
    const { data, error } = await _supabase
        .from('proposte_consiglieri')
        .select('*')
        .order('id', { ascending: false });

    if (error) return;

    const pendingContainer = document.getElementById('pending-container');
    const storicoBody = document.getElementById('storico-proposte-body');
    
    pendingContainer.innerHTML = '';
    storicoBody.innerHTML = '';

    data.forEach(p => {
        const nomeVisualizzato = p.username ? p.username.replace('.', ' ').toUpperCase() : "Sconosciuto";
        const dataFormattata = new Date(p.data_proposta).toLocaleDateString('it-IT');
        
        if (p.stato === 'In Attesa') {
            const card = document.createElement('div');
            card.className = 'proposta-card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <span class="card-user">Da: ${nomeVisualizzato}</span>
                    <span style="font-size:0.65rem; color:#555;">${dataFormattata}</span>
                </div>
                <span class="card-title">${p.titolo}</span>
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:15px;">
                    <a href="${p.link_documento}" target="_blank" class="btn-gold-action" style="text-decoration:none; text-align:center; font-size:0.65rem; padding:8px;">VEDI ATTO ↗</a>
                    <div style="display:flex; gap:8px;">
                        <button onclick="apriValutazione(${p.id}, 'Approvata', '${p.titolo.replace(/'/g, "\\'")}', '${p.feedback_direzione || ""}')" class="btn-approve" style="flex:1; padding:8px; border-radius:4px; font-weight:700; font-size:0.65rem; cursor:pointer; border:1px solid rgba(46, 204, 113, 0.4); background:rgba(46, 204, 113, 0.1); color:#2ecc71;">APPROVA</button>
                        <button onclick="apriValutazione(${p.id}, 'Rifiutata', '${p.titolo.replace(/'/g, "\\'")}', '${p.feedback_direzione || ""}')" class="btn-reject" style="flex:1; padding:8px; border-radius:4px; font-weight:700; font-size:0.65rem; cursor:pointer; border:1px solid rgba(231, 76, 60, 0.4); background:rgba(231, 76, 60, 0.1); color:#e74c3c;">RIFIUTA</button>
                    </div>
                </div>
            `;
            pendingContainer.appendChild(card);
        } else {
            const tr = document.createElement('tr');
            const color = p.stato === 'Approvata' ? '#2ecc71' : (p.stato === 'Sospesa' ? '#f1c40f' : '#e74c3c');
            tr.innerHTML = `
                <td><span style="color:#fff; font-weight:600;">${p.titolo}</span></td>
                <td style="color:#888; font-size:0.8rem;">${nomeVisualizzato}</td>
                <td style="text-align:center;">
                    <span class="status-badge" style="background:${color}15; color:${color}; border:1px solid ${color}33;">${p.stato}</span>
                </td>
                <td style="text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:10px; align-items:center;">
                        <span style="font-size:0.7rem; color:#555;">${dataFormattata}</span>
                        <button onclick="apriValutazione(${p.id}, '${p.stato}', '${p.titolo.replace(/'/g, "\\'")}', '${p.feedback_direzione || ""}')" style="padding:6px 12px; border-radius:4px; font-weight:700; font-size:0.6rem; cursor:pointer; border:1px solid rgba(212, 175, 55, 0.4); background:rgba(212, 175, 55, 0.1); color:#d4af37;">MODIFICA</button>
                    </div>
                </td>
            `;
            storicoBody.appendChild(tr);
        }
    });
}

function apriValutazione(id, decisione, titolo, feedbackPrecedente) {
    propostaSelezionata = id;
    document.getElementById('modalTitle').innerText = `Gestione: ${titolo}`;
    document.getElementById('modalInfo').innerText = `Stato Attuale: ${decisione.toUpperCase()}`;
    document.getElementById('feedbackTesto').value = feedbackPrecedente || "";
    
    const footer = document.querySelector('#modalDecisione div div:last-child');
    footer.innerHTML = `
        <button onclick="chiudiModal()" style="padding:10px 15px; border-radius:4px; font-weight:700; font-size:0.7rem; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#888;">ANNULLA</button>
        <div style="display:flex; gap:10px;">
            <button onclick="cambiaDecisioneEConferma('Approvata')" style="padding:10px 15px; border-radius:4px; font-weight:700; font-size:0.7rem; cursor:pointer; border:1px solid rgba(46, 204, 113, 0.4); background:rgba(46, 204, 113, 0.1); color:#2ecc71;">APPROVA</button>
            <button onclick="cambiaDecisioneEConferma('Rifiutata')" style="padding:10px 15px; border-radius:4px; font-weight:700; font-size:0.7rem; cursor:pointer; border:1px solid rgba(231, 76, 60, 0.4); background:rgba(231, 76, 60, 0.1); color:#e74c3c;">RIFIUTA</button>
        </div>
    `;
    
    document.getElementById('modalDecisione').style.display = 'flex';
}

async function cambiaDecisioneEConferma(decisione) {
    const feedback = document.getElementById('feedbackTesto').value.trim();

    const { error } = await _supabase
        .from('proposte_consiglieri')
        .update({ 
            stato: decisione, 
            feedback_direzione: feedback 
        })
        .eq('id', propostaSelezionata);

    if (!error) {
        await inviaLog("Gestione Proposte", `Atto ID ${propostaSelezionata} impostato su ${decisione}`);
        chiudiModal();
        caricaTutteLeProposte();
    }
}

function chiudiModal() {
    document.getElementById('modalDecisione').style.display = 'none';
    document.getElementById('feedbackTesto').value = '';
}

async function inviaLog(azione, dettagli = "") {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        const username = session?.user?.email ? session.user.email.split('@')[0].toUpperCase() : "SISTEMA";
        const messaggioFormattato = `🦅 *Pactum Patriae*\nʟᴏɢ ɢᴇsᴛɪᴏɴᴇ\n\n👤 ᴏᴘᴇʀᴀᴛᴏʀᴇ: ${username}\n📝 ᴀᴢɪᴏɴᴇ: ${azione}\n\n📖 ᴅᴇᴛᴛᴀɢʟɪ: ${dettagli}`;
        await _supabase.functions.invoke('send-telegram-messaggio', {
            body: { messaggio: messaggioFormattato }
        });
    } catch (err) { console.error(err); }
}

function logout() {
    _supabase.auth.signOut().then(() => {
        sessionStorage.clear();
        window.location.replace('login.html');
    });
}
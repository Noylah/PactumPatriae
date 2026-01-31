const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_AUTORIZZATO = 'Zicli'; 

(async function protezioneTotale() {
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();

    if (sessionError || !session) {
        window.location.replace('login.html');
        return;
    }

    try {
        const emailUtente = session.user.email;
        const usernameDaCercare = emailUtente.split('@')[0];

        const { data: profilo, error: dbError } = await _supabase
            .from('staff_users')
            .select('permessi')
            .eq('username', usernameDaCercare) 
            .single();

        if (dbError || !profilo) {
            console.error("Dati mancanti per lo username:", usernameDaCercare);
            alert("Errore: Il tuo account non è censito nella tabella staff_users.");
            window.location.replace('login.html');
            return;
        }

        const paginaCorrente = window.location.pathname.split('/').pop();
        const mappePermessi = { 
            'staff.html': 'C',    
            'riunioni.html': 'R', 
            'bilancio.html': 'E',
            'notizie.html': 'N',
            'credenziali.html': 'A'
        };
        
        const letteraNecessaria = mappePermessi[paginaCorrente];

        if (letteraNecessaria && !profilo.permessi.includes(letteraNecessaria)) {
            alert("Accesso negato: non hai i permessi necessari.");
            window.location.replace('login.html');
            return;
        }

        document.body.style.visibility = "visible";
        document.body.style.opacity = "1";

    } catch (err) {
        console.error("Errore critico:", err);
        window.location.replace('login.html');
    }
})();
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

async function inizializzaCredenziali() {
    const sessionUser = sessionStorage.getItem('loggedUser'); 
    const permessi = sessionStorage.getItem('userPermessi') || "";

    if (sessionUser === ADMIN_AUTORIZZATO || permessi.includes('A')) {
        fetchUtenti();
        gestisciMenuLaterale();
    } else {
        inviaLog("Sicurezza: Accesso negato", "Tentativo accesso non autorizzato a Credenziali");
        alert("Accesso negato.");
        window.location.href = 'staff.html';
    }
}

function gestisciMenuLaterale() {
    const permessi = sessionStorage.getItem('userPermessi') || "";
    const sessionUser = sessionStorage.getItem('loggedUser');
    if (sessionUser === ADMIN_AUTORIZZATO) return;

    const mappe = {
        'staff.html': 'C',
        'riunioni.html': 'R',
        'bilancio.html': 'E',
        'credenziali.html': 'A'
    };

    document.querySelectorAll('.panel-link').forEach(link => {
        const href = link.getAttribute('href');
        const letteraNecessaria = mappe[href];
        if (letteraNecessaria && !permessi.includes(letteraNecessaria)) {
            link.style.display = 'none';
        }
    });
}

function toggleUserForm() {
    const container = document.getElementById('userFormContainer');
    if (container) {
        container.style.display = (container.style.display === 'none' || container.style.display === '') ? 'block' : 'none';
    }
}

async function creaAccount() {
    const user = document.getElementById('newUsername').value.trim();
    if (!user) return alert("Inserisci un username!");

    const { error } = await _supabase.from('staff_users').insert([
        { username: user, permessi: 'R' }
    ]);

    if (error) {
        alert("Errore: l'utente esiste già o problema di connessione.");
        inviaLog("Sicurezza: Errore creazione account", `Username: ${user} | Errore: ${error.message}`);
    } else {
        inviaLog("Sicurezza: Nuovo account creato", `Username: ${user}`);
        alert("Username aggiunto! Ora crealo su Supabase Auth.");
        document.getElementById('newUsername').value = '';
        toggleUserForm();
        fetchUtenti();
    }
}

async function fetchUtenti() {
    const { data, error } = await _supabase.from('staff_users').select('*').order('username');
    if (error) return;

    const tbody = document.getElementById('credenziali-data-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(u => {
        const p = u.permessi || "";
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="text" value="${u.username}" 
                    class="minimal-input" 
                    style="background:transparent; border:none; color:#d4af37; font-weight:bold; width:100%;" 
                    onchange="aggiornaUsername(${u.id}, this.value, '${u.username}')">
            </td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 4px; justify-content: center;">
                    ${creaBottone(u.id, 'C', p.includes('C'), 'Consiglieri', u.username)}
                    ${creaBottone(u.id, 'R', p.includes('R'), 'Riunioni', u.username)}
                    ${creaBottone(u.id, 'E', p.includes('E'), 'Economia', u.username)}
                    ${creaBottone(u.id, 'N', p.includes('N'), 'Notizie', u.username)} 
                    ${creaBottone(u.id, 'A', p.includes('A'), 'Admin', u.username)}
                </div>
            </td>
            <td style="text-align: right;">
                <button class="btn-action-dash delete" onclick="rimuoviPermessi(${u.id}, '${u.username}')" 
                    style="background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2); padding: 5px 10px; cursor:pointer; border-radius:4px;">
                    REVOCA
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function creaBottone(userId, lettera, attivo, label, username) {
    const stileBase = `width: 35px; height: 35px; border-radius: 6px; cursor: pointer; font-weight: 800; border: 1px solid; transition: all 0.2s;`;
    const stileStato = attivo 
        ? `background: #d4af37; color: #1a1a1a; border-color: #d4af37;` 
        : `background: transparent; color: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.1);`;

    return `<button title="${label}" onclick="togglePermesso(${userId}, '${lettera}', '${username}')" style="${stileBase} ${stileStato}">${lettera}</button>`;
}

async function aggiornaUsername(id, nuovoNome, vecchioNome) {
    if (!nuovoNome.trim()) return fetchUtenti();
    const { error } = await _supabase.from('staff_users').update({ username: nuovoNome.trim() }).eq('id', id);
    if (error) {
        alert("Errore nell'aggiornamento username.");
    } else {
        inviaLog("Sicurezza: Username modificato", `Da ${vecchioNome} a ${nuovoNome}`);
    }
    fetchUtenti();
}

async function togglePermesso(id, lettera, username) {
    const { data } = await _supabase.from('staff_users').select('permessi').eq('id', id).single();
    let p = data.permessi || "";
    p = p.includes(lettera) ? p.replace(lettera, "") : p + lettera;
    const { error } = await _supabase.from('staff_users').update({ permessi: p }).eq('id', id);
    if (!error) {
        inviaLog("Sicurezza: Permessi modificati", `Utente: ${username} | Permesso [${lettera}] ${p.includes(lettera) ? 'Attivato' : 'Disattivato'}`);
    }
    fetchUtenti();
}

async function rimuoviPermessi(id, username) {
    if (username === ADMIN_AUTORIZZATO) return alert("Impossibile revocare i permessi dell'Admin.");
    if (!confirm(`Rimuovere i permessi a ${username}?`)) return;
    const { error } = await _supabase.from('staff_users').delete().eq('id', id);
    if (!error) {
        inviaLog("Sicurezza: Account rimosso", `Revocati tutti i permessi a ${username}`);
    }
    fetchUtenti();
}

function logout() {
    inviaLog("Sistema: Logout");
    _supabase.auth.signOut();
    sessionStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', inizializzaCredenziali);
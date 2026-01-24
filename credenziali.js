const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_AUTORIZZATO = 'Zicli'; 

async function inizializzaCredenziali() {
    const sessionUser = sessionStorage.getItem('loggedUser'); 
    const permessi = sessionStorage.getItem('userPermessi') || "";

    if (sessionUser === ADMIN_AUTORIZZATO || permessi.includes('A')) {
        fetchUtenti();
        gestisciMenuLaterale();
    } else {
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
    } else {
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
                    onchange="aggiornaUsername(${u.id}, this.value)">
            </td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 4px; justify-content: center;">
                    ${creaBottone(u.id, 'C', p.includes('C'), 'Consiglieri')}
                    ${creaBottone(u.id, 'R', p.includes('R'), 'Riunioni')}
                    ${creaBottone(u.id, 'E', p.includes('E'), 'Economia')}
                    ${creaBottone(u.id, 'A', p.includes('A'), 'Admin')}
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

function creaBottone(userId, lettera, attivo, label) {
    const stileBase = `width: 35px; height: 35px; border-radius: 6px; cursor: pointer; font-weight: 800; border: 1px solid; transition: all 0.2s;`;
    const stileStato = attivo 
        ? `background: #d4af37; color: #1a1a1a; border-color: #d4af37;` 
        : `background: transparent; color: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.1);`;

    return `<button title="${label}" onclick="togglePermesso(${userId}, '${lettera}')" style="${stileBase} ${stileStato}">${lettera}</button>`;
}

async function aggiornaUsername(id, nuovoNome) {
    if (!nuovoNome.trim()) return fetchUtenti();
    const { error } = await _supabase.from('staff_users').update({ username: nuovoNome.trim() }).eq('id', id);
    if (error) alert("Errore nell'aggiornamento username.");
    fetchUtenti();
}

async function togglePermesso(id, lettera) {
    const { data } = await _supabase.from('staff_users').select('permessi').eq('id', id).single();
    let p = data.permessi || "";
    p = p.includes(lettera) ? p.replace(lettera, "") : p + lettera;
    await _supabase.from('staff_users').update({ permessi: p }).eq('id', id);
    fetchUtenti();
}

async function rimuoviPermessi(id, username) {
    if (username === ADMIN_AUTORIZZATO) return alert("Impossibile revocare i permessi dell'Admin.");
    if (!confirm(`Rimuovere i permessi a ${username}?`)) return;
    await _supabase.from('staff_users').delete().eq('id', id);
    fetchUtenti();
}

function logout() {
    _supabase.auth.signOut();
    sessionStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', inizializzaCredenziali);
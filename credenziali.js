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
    container.style.display = (container.style.display === 'none' || container.style.display === '') ? 'block' : 'none';
}

async function fetchUtenti() {
    const { data, error } = await _supabase.from('staff_users').select('*').order('username');
    if (error) return;

    const tbody = document.getElementById('credenziali-data-body');
    tbody.innerHTML = '';

    data.forEach(u => {
        const p = u.permessi || "";
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${u.username}" class="minimal-input" style="background:transparent; border:none; color:#d4af37;" onchange="aggiornaCampo(${u.id}, 'username', this.value)"></td>
            <td style="text-align: center; color: rgba(212,175,55,0.5); font-size:0.8rem;">${u.password}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 4px; justify-content: center;">
                    ${creaBottonePermesso(u.id, 'C', p.includes('C'), 'Consiglieri')}
                    ${creaBottonePermesso(u.id, 'R', p.includes('R'), 'Riunioni')}
                    ${creaBottonePermesso(u.id, 'E', p.includes('E'), 'Economia')}
                    ${creaBottonePermesso(u.id, 'A', p.includes('A'), 'Admin')}
                </div>
            </td>
            <td><input type="text" id="pass-${u.id}" class="minimal-input" placeholder="Nuova..." style="width:80px;"></td>
            <td style="text-align: right;">
                <button class="btn-action-dash edit" onclick="aggiornaPassword(${u.id})">SALVA</button>
                <button class="btn-action-dash delete" onclick="eliminaAccount(${u.id}, '${u.username}')" style="background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2); margin-left:5px;">ELIMINA</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function creaBottonePermesso(userId, lettera, attivo, label) {
    const stileBase = `
        width: 32px; 
        height: 32px; 
        border-radius: 6px; 
        cursor: pointer; 
        font-weight: 800; 
        font-size: 0.75rem; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 2px;
        border: 1px solid;
        text-transform: uppercase;
    `;

    const stileStato = attivo 
        ? `background: #d4af37; color: #1a1a1a; border-color: #d4af37; box-shadow: 0 0 12px rgba(212, 175, 55, 0.3); transform: scale(1.05);` 
        : `background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.3); border-color: rgba(255, 255, 255, 0.1);`;

    return `
        <button 
            title="${label}" 
            onclick="toggleLettera(${userId}, '${lettera}', this)" 
            class="permesso-btn ${attivo ? 'attivo' : ''}"
            onmouseover="this.style.borderColor='#d4af37'; this.style.color='white';"
            onmouseout="this.style.borderColor='${attivo ? '#d4af37' : 'rgba(255, 255, 255, 0.1)'}'; this.style.color='${attivo ? '#1a1a1a' : 'rgba(255, 255, 255, 0.3)'}';"
            style="${stileBase} ${stileStato}"
        >
            ${lettera}
        </button>
    `;
}

async function toggleLettera(id, lettera) {
    const { data } = await _supabase.from('staff_users').select('permessi').eq('id', id).single();
    let p = data.permessi || "";
    p = p.includes(lettera) ? p.replace(lettera, "") : p + lettera;
    await _supabase.from('staff_users').update({ permessi: p }).eq('id', id);
    fetchUtenti();
}

async function creaAccount() {
    const user = document.getElementById('newUsername').value.trim();
    const pass = document.getElementById('newPassword').value.trim();
    if (!user || !pass) return alert("Dati mancanti!");
    const { error } = await _supabase.from('staff_users').insert([{ username: user, password: pass, permessi: 'CRE' }]);
    if (error) alert(error.message);
    else {
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        toggleUserForm();
        fetchUtenti();
    }
}

async function aggiornaCampo(id, campo, valore) {
    const obj = {};
    obj[campo] = valore;
    await _supabase.from('staff_users').update(obj).eq('id', id);
}

async function aggiornaPassword(id) {
    const nuovaPass = document.getElementById(`pass-${id}`).value.trim();
    if (!nuovaPass) return alert("Inserisci password.");
    const { error } = await _supabase.from('staff_users').update({ password: nuovaPass }).eq('id', id);
    if (error) alert(error.message);
    else {
        alert("Password aggiornata!");
        fetchUtenti();
    }
}

async function eliminaAccount(id, username) {
    if (username === ADMIN_AUTORIZZATO) return alert("Impossibile eliminare l'Admin.");
    if (!confirm(`Revocare l'accesso a ${username}?`)) return;
    await _supabase.from('staff_users').delete().eq('id', id);
    fetchUtenti();
}

function logout() {
    sessionStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', inizializzaCredenziali);
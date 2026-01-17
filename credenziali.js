const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_AUTORIZZATO = 'Zicli'; 

async function inizializzaCredenziali() {
    const sessionUser = sessionStorage.getItem('loggedUser'); 
    
    if (!sessionUser || sessionUser.trim() !== ADMIN_AUTORIZZATO) {
        alert("Accesso negato. Solo l'Amministratore può gestire le credenziali.");
        window.location.href = 'staff.html';
        return;
    }
    fetchUtenti();
}

function toggleUserForm() {
    const container = document.getElementById('userFormContainer');
    console.log("Pulsante cliccato. Container trovato:", container);

    if (!container) {
        alert("Errore: Il modulo 'userFormContainer' non esiste nell'HTML.");
        return;
    }

    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

async function fetchUtenti() {
    const { data, error } = await _supabase
        .from('staff_users')
        .select('*')
        .order('username');

    if (error) {
        console.error("Errore fetch:", error);
        return;
    }

    const tbody = document.getElementById('credenziali-data-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
    <td style="vertical-align: middle;">
        <input type="text" value="${u.username}" class="minimal-input" 
               style="margin:0; font-weight:600; color:#d4af37; background:transparent; border:none; padding:8px 5px; width: 100%;"
               onchange="aggiornaUsername(${u.id}, this.value)">
    </td>
    <td style="text-align: center; font-family: 'Public Sans', sans-serif; color: rgba(212, 175, 55, 0.7); font-size: 0.9rem; vertical-align: middle;">
        ${u.password}
    </td>
    <td style="vertical-align: middle;">
        <input type="text" id="pass-${u.id}" class="minimal-input" placeholder="Nuova password..." 
               style="margin:0; width: 90%; font-size: 0.8rem; padding: 8px 10px;">
    </td>
    <td style="text-align: right; vertical-align: middle;">
        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; min-height: 40px;">
            <button class="btn-action-dash edit" onclick="aggiornaPassword(${u.id})" 
                    style="margin:0; height: 32px; padding: 0 15px; display: inline-flex; align-items: center; justify-content: center; line-height: 1;">
                SALVA
            </button>
            <button class="btn-action-dash delete" onclick="eliminaAccount(${u.id}, '${u.username}')" 
                    style="background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2); margin:0; height: 32px; width: 32px; display: inline-flex; align-items: center; justify-content: center; line-height: 1;">
                X
            </button>
        </div>
    </td>
`;
        tbody.appendChild(tr);
    });
}

async function creaAccount() {
    const user = document.getElementById('newUsername').value.trim();
    const pass = document.getElementById('newPassword').value.trim();
    const role = document.getElementById('newRole').value;

    if (!user || !pass) {
        alert("Username e Password sono obbligatori!");
        return;
    }

    const { error } = await _supabase
        .from('staff_users')
        .insert([{ username: user, password: pass, ruolo: role }]);

    if (error) {
        alert("Errore durante la creazione: " + error.message);
    } else {
        alert("Account creato con successo!");
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        toggleUserForm();
        fetchUtenti();
    }
}

async function aggiornaUsername(id, nuovoUser) {
    if (!nuovoUser.trim()) {
        alert("L'username non può essere vuoto.");
        fetchUtenti();  
        return;
    }
    
    const { error } = await _supabase
        .from('staff_users')
        .update({ username: nuovoUser })
        .eq('id', id);

    if (error) {
        alert("Errore nell'aggiornamento username: " + error.message);
        fetchUtenti();
    } else {
        console.log("Username aggiornato.");
    }
}

async function aggiornaPassword(id) {
    const nuovaPass = document.getElementById(`pass-${id}`).value.trim();
    if (!nuovaPass) {
        alert("Inserisci una password valida.");
        return;
    }

    const { error } = await _supabase
        .from('staff_users')
        .update({ password: nuovaPass })
        .eq('id', id);

    if (error) {
        alert("Errore: " + error.message);
    } else {
        alert("Password aggiornata correttamente!");
        fetchUtenti();
    }
}

async function eliminaAccount(id, username) {
    if (username === ADMIN_AUTORIZZATO) {
        alert("Sicurezza: Non puoi eliminare l'account amministratore principale.");
        return;
    }

    if (!confirm(`Sei sicuro di voler revocare l'accesso a "${username}"?`)) return;

    const { error } = await _supabase
        .from('staff_users')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Errore eliminazione: " + error.message);
    } else {
        fetchUtenti();
    }
}

function logout() {
    sessionStorage.clear();
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', inizializzaCredenziali);
(function() {
    const isLogged = sessionStorage.getItem('staffAccess');
    if (isLogged !== 'true') {
        window.location.replace('login.html');
    }
})();

const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.closeModal = closeModal;
window.apriAnteprima = openDynamicModal;
let currentEditId = null;

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
            window.location.replace('login.html');
            return;
        }
        if (!profilo.permessi.includes('N') && usernameDaCercare !== 'Zicli') {
            alert("Accesso negato: non hai i permessi per gestire le notizie.");
            window.location.replace('staff.html');
            return;
        }
        document.body.style.visibility = "visible";
        document.body.style.opacity = "1";
    } catch (err) {
        window.location.replace('login.html');
    }
})();

async function inviaLog(messaggio, descrizione = "") {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        await _supabase.functions.invoke('send-telegram-log', {
            body: { messaggio, descrizione },
            headers: { Authorization: `Bearer ${session?.access_token}` }
        });
    } catch (err) { console.error(err.message); }
}

function gestisciAccessoPagina() {
    const permessi = sessionStorage.getItem('userPermessi') || "";
    const sessionUser = (sessionStorage.getItem('loggedUser') || "").trim();
    if (sessionUser === 'Zicli') return;
    const mappe = {
        'staff.html': 'C',
        'riunioni.html': 'R',
        'bilancio.html': 'E',
        'notizie.html': 'N',
        'credenziali.html': 'A'
    };
    document.querySelectorAll('.panel-link').forEach(link => {
        const href = link.getAttribute('href').split('/').pop();
        const letteraRichiesta = mappe[href];
        if (letteraRichiesta && !permessi.includes(letteraRichiesta)) {
            link.style.display = 'none';
        } else {
            link.style.display = 'flex';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('newsDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    gestisciAccessoPagina();
    caricaNotizie();
});

async function caricaNotizie() {
    const { data: notizie, error } = await _supabase
        .from('notizie')
        .select('*')
        .order('data_comunicato', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) return;
    window.listaNotizie = notizie;
    const tbody = document.getElementById('news-data-body');
    tbody.innerHTML = notizie.map(n => {
        const dataVis = n.data_comunicato ? new Date(n.data_comunicato).toLocaleDateString() : new Date(n.created_at).toLocaleDateString();
        return `
            <tr onclick="apriAnteprima('${n.id}')" style="cursor: pointer;">
                <td style="text-align: left; font-weight: 600;">${n.titolo}</td>
                <td style="text-align: center;"><span class="badge-mini">${n.badge || '-'}</span></td>
                <td style="text-align: center; opacity: 0.7;">${dataVis}</td>
                <td style="text-align: right;">
                    <div style="display: flex; justify-content: flex-end; gap: 8px;" onclick="event.stopPropagation()">
                        <button class="btn-action-dash edit" onclick="apriModifica('${n.id}')">MODIFICA</button>
                        <button class="btn-action-dash delete" onclick="eliminaNotizia('${n.id}', '${n.titolo.replace(/'/g, "\\'")}')">RIMUOVI</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openDynamicModal(id) {
    const data = window.listaNotizie.find(item => item.id === id);
    if (!data) return;
    document.getElementById('modalName').innerText = data.titolo;
    document.getElementById('modalBadge').innerText = data.badge || "COMUNICATO";
    document.getElementById('modalBody').innerHTML = data.contenuto.replace(/\n/g, '<br>');
    const imgContainer = document.getElementById('modalImageContainer');
    const imgTag = document.getElementById('modalImage');
    if (data.immagine_url) {
        imgTag.src = `https://images.weserv.nl/?url=${encodeURIComponent(data.immagine_url)}`;
        imgContainer.style.display = 'block';
    } else {
        imgContainer.style.display = 'none';
    }
    const modal = document.getElementById('dynamicModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('dynamicModal');
    if(modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

async function salvaNotizia() {
    const titolo = document.getElementById('newsTitle').value.trim();
    const badge = document.getElementById('newsBadge').value.trim();
    const data_com = document.getElementById('newsDate').value;
    const sottotitolo = document.getElementById('newsSubtitle').value.trim();
    const contenuto = document.getElementById('newsContent').value.trim();
    const immagine_url = document.getElementById('newsImageUrl').value.trim();
    if (!titolo || !contenuto || !data_com) return alert("Inserisci Titolo, Contenuto e Data.");
    const { error } = await _supabase.from('notizie').insert([{ titolo, badge, data_comunicato: data_com, sottotitolo, contenuto, immagine_url }]);
    if (error) {
        alert(error.message);
    } else {
        await inviaLog("Notizie: Nuovo comunicato", `Titolo: ${titolo}`);
        location.reload();
    }
}

function apriModifica(id) {
    const n = window.listaNotizie.find(item => item.id === id);
    if (!n) return;
    currentEditId = n.id;
    document.getElementById('edit-titolo').value = n.titolo || '';
    document.getElementById('edit-data').value = n.data_comunicato || '';
    document.getElementById('edit-badge').value = n.badge || '';
    document.getElementById('edit-sottotitolo').value = n.sottotitolo || '';
    document.getElementById('edit-contenuto').value = n.contenuto || '';
    document.getElementById('edit-immagine').value = n.immagine_url || '';
    document.getElementById('editModal').style.display = 'flex';
}

async function salvaModificaCompleta() {
    const updates = {
        titolo: document.getElementById('edit-titolo').value,
        data_comunicato: document.getElementById('edit-data').value,
        badge: document.getElementById('edit-badge').value,
        sottotitolo: document.getElementById('edit-sottotitolo').value,
        contenuto: document.getElementById('edit-contenuto').value,
        immagine_url: document.getElementById('edit-immagine').value
    };
    const { error } = await _supabase.from('notizie').update(updates).eq('id', currentEditId);
    if (error) {
        alert(error.message);
    } else {
        await inviaLog("Notizie: Comunicato modificato", `Titolo: ${updates.titolo}`);
        location.reload();
    }
}

async function eliminaNotizia(id, titolo) {
    if (confirm(`Eliminare definitivamente la notizia "${titolo}"?`)) {
        const { error } = await _supabase.from('notizie').delete().eq('id', id);
        if (!error) {
            await inviaLog("Notizie: Comunicato rimosso", `Titolo: ${titolo}`);
            location.reload();
        }
    }
}

function toggleAddForm() {
    const container = document.getElementById('addFormContainer');
    if(container) container.style.display = (container.style.display === 'none') ? 'block' : 'none';
}

function chiudiModal() {
    document.getElementById('editModal').style.display = 'none';
}

function logout() {
    inviaLog("Sistema: Logout effettuato");
    _supabase.auth.signOut();
    sessionStorage.clear();
    window.location.replace('login.html');
}

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('dynamicModal')) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") { closeModal(); chiudiModal(); }
});

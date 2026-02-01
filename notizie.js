(function() {
    if (sessionStorage.getItem('staffAccess') !== 'true') window.location.replace('login.html');
})();

const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentEditId = null;

async function inviaLog(messaggio, descrizione = "") {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        await _supabase.functions.invoke('send-telegram-log', {
            body: { messaggio, descrizione },
            headers: { Authorization: `Bearer ${session?.access_token}` }
        });
    } catch (err) { console.error(err.message); }
}

document.addEventListener('DOMContentLoaded', () => {
    const dInput = document.getElementById('newsDate');
    if (dInput) dInput.value = new Date().toISOString().split('T')[0];
    caricaNotizie();
});

async function caricaNotizie() {
    const { data: notizie, error } = await _supabase
        .from('notizie')
        .select('*')
        .order('data_comunicato', { ascending: false });

    if (error) return;
    window.listaNotizie = notizie;
    const tbody = document.getElementById('news-data-body');
    
    tbody.innerHTML = notizie.map(n => {
        const dataFmt = n.data_comunicato ? new Date(n.data_comunicato).toLocaleDateString('it-IT') : '---';
        return `
            <tr onclick="openDynamicModal('${n.id}')" style="cursor: pointer;">
                <td style="text-align: left; font-weight: 600;">${n.titolo}</td>
                <td style="text-align: center;"><span class="badge-mini">${n.badge || '-'}</span></td>
                <td style="text-align: center; opacity: 0.7;">${dataFmt}</td>
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

async function salvaNotizia() {
    const titolo = document.getElementById('newsTitle').value.trim();
    const badge = document.getElementById('newsBadge').value.trim();
    const data_com = document.getElementById('newsDate').value;
    const sottotitolo = document.getElementById('newsSubtitle').value.trim();
    const contenuto = document.getElementById('newsContent').value.trim();
    const immagine_url = document.getElementById('newsImageUrl').value.trim();

    if (!titolo || !contenuto || !data_com) return alert("Compila Titolo, Contenuto e Data.");

    const { error } = await _supabase.from('notizie').insert([{ 
        titolo, badge, data_comunicato: data_com, sottotitolo, contenuto, immagine_url 
    }]);

    if (error) alert(error.message);
    else {
        await inviaLog("Notizie: Nuovo comunicato", titolo);
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
    if (error) alert(error.message);
    else {
        await inviaLog("Notizie: Modifica", updates.titolo);
        location.reload();
    }
}

async function eliminaNotizia(id, titolo) {
    if (confirm(`Eliminare "${titolo}"?`)) {
        const { error } = await _supabase.from('notizie').delete().eq('id', id);
        if (!error) location.reload();
    }
}

function openDynamicModal(id) {
    const data = window.listaNotizie.find(item => item.id === id);
    if (!data) return;
    document.getElementById('modalName').innerText = data.titolo;
    document.getElementById('modalBadge').innerText = data.badge || "COMUNICATO";
    document.getElementById('modalBody').innerHTML = data.contenuto.replace(/\n/g, '<br>');
    const imgCont = document.getElementById('modalImageContainer');
    const img = document.getElementById('modalImage');
    if (data.immagine_url) {
        img.src = `https://images.weserv.nl/?url=${encodeURIComponent(data.immagine_url)}`;
        imgCont.style.display = 'block';
    } else imgCont.style.display = 'none';
    document.getElementById('dynamicModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('dynamicModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function chiudiModal() { document.getElementById('editModal').style.display = 'none'; }
function toggleAddForm() {
    const c = document.getElementById('addFormContainer');
    c.style.display = (c.style.display === 'none') ? 'block' : 'none';
}
function logout() {
    _supabase.auth.signOut();
    sessionStorage.clear();
    window.location.replace('login.html');
}

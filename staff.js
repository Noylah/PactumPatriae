    (function() {
    const isLogged = sessionStorage.getItem('staffAccess');
    if (isLogged !== 'true') {
        window.location.replace('login.html');
    }
})();

const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Accesso autorizzato. Caricamento dashboard...");
    fetchConsiglieri();
});

async function fetchConsiglieri() {
    const listElement = document.getElementById('staff-data-body');
    const tableHead = document.getElementById('table-head');
    
    if (!listElement || !tableHead) return;

    tableHead.innerHTML = `
        <th>Nome Consigliere</th>
        <th style="text-align: center;">Presenze Totali</th>
        <th style="text-align: right;">Operazioni</th>
    `;

    try {
        const { data, error } = await _supabase
            .from('consiglieri')
            .select(`id, nome, presenze(count)`)
            .order('nome', { ascending: true });

        if (error) throw error;

        listElement.innerHTML = '';
        
        if (data.length === 0) {
            listElement.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Nessun consigliere trovato.</td></tr>';
            return;
        }

        data.forEach(c => {
    const numPresenze = c.presenze[0]?.count || 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="text-align: left;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span id="nome-text-${c.id}" style="color: white; font-weight: 600;">${c.nome}</span>
                <input type="text" id="edit-input-${c.id}" value="${c.nome}" 
                       style="display:none; background: rgba(0,0,0,0.5); color:white; border:1px solid #d4af37; padding:5px 10px; border-radius:4px; font-size:0.9rem; width: 200px;">
            </div>
        </td>

        <td style="text-align: center;">
            <span class="badge-count">${numPresenze} Sedute</span>
        </td>

        <td style="text-align: right; padding-right: 0; width: 1%; white-space: nowrap;">
            <div style="display: flex; justify-content: flex-end; gap: 8px; align-items: center;">
                <button id="btn-edit-${c.id}" class="btn-action-dash edit" onclick="abilitaModifica(${c.id})">MODIFICA</button>
                <button id="btn-save-${c.id}" class="btn-action-dash save" style="display:none;" onclick="salvaModifica(${c.id})">SALVA</button>
                <button class="btn-action-dash delete" onclick="eliminaConsigliere(${c.id})">RIMUOVI</button>
            </div>
        </td>
    `;
    listElement.appendChild(tr);
});

    } catch (err) {
        console.error("Errore fetch:", err.message);
        listElement.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff4d4d;">Errore di sincronizzazione: ${err.message}</td></tr>`;
    }
}

async function segnaPresenza(id) {
    const oggi = new Date().toISOString().split('T')[0];
    try {
        const { error } = await _supabase
            .from('presenze')
            .insert([{ consigliere_id: id, data_riunione: oggi }]);

        if (error) throw new Error("Presenza già registrata per oggi.");
        
        console.log("Presenza salvata correttamente.");
        fetchConsiglieri();
    } catch (err) {
        alert(err.message);
    }
}

async function eliminaConsigliere(id) {
    if(confirm("Sei sicuro di voler rimuovere permanentemente questo consigliere?")) {
        const { error } = await _supabase.from('consiglieri').delete().eq('id', id);
        if(!error) {
            fetchConsiglieri();
        } else {
            alert("Errore durante l'eliminazione: " + error.message);
        }
    }
}

async function aggiungiConsigliere() {
    const nomeInput = document.getElementById('nuovoNome');
    const nome = nomeInput.value.trim();

    if (!nome) {
        alert("Per favore, inserisci un nome valido.");
        return;
    }

    try {
        console.log("Inserimento nuovo consigliere:", nome);
        
        const { data, error } = await _supabase
            .from('consiglieri')
            .insert([{ nome: nome }]) 
            .select();

        if (error) throw error;

        console.log("Consigliere aggiunto con successo!");
        
        nomeInput.value = '';
        toggleAddForm();
        fetchConsiglieri(); 
        
    } catch (err) {
        console.error("Errore durante l'aggiunta:", err.message);
        alert("Errore: " + err.message);
    }
}

function toggleAddForm() {
    const form = document.getElementById('addFormContainer');
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
    }
}

function abilitaModifica(id) {
    document.getElementById(`nome-text-${id}`).style.display = 'none';
    document.getElementById(`edit-input-${id}`).style.display = 'block';
    document.getElementById(`btn-edit-${id}`).style.display = 'none';
    document.getElementById(`btn-save-${id}`).style.display = 'block';
}

async function salvaModifica(id) {
    const nuovoNome = document.getElementById(`edit-input-${id}`).value.trim();

    if (!nuovoNome) {
        alert("Il nome non può essere vuoto.");
        return;
    }

    try {
        const { error } = await _supabase
            .from('consiglieri')
            .update({ nome: nuovoNome })
            .eq('id', id);

        if (error) throw error;

        console.log("Nome aggiornato con successo!");
        fetchConsiglieri(); 
    } catch (err) {
        console.error("Errore modifica:", err.message);
        alert("Impossibile aggiornare: " + err.message);
    }
}

function logout() {
    sessionStorage.removeItem('staffAccess');
    window.location.replace('login.html');
}
(function() {
    const isLogged = sessionStorage.getItem('staffAccess');
    if (isLogged !== 'true') {
        window.location.replace('login.html');
    }
})();

const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function inviaLog(messaggio, descrizione = "") {
    const utente = sessionStorage.getItem('loggedUser') || 'Sconosciuto';
    try {
        await _supabase.functions.invoke('send-telegram-log', {
            body: { messaggio, utente, descrizione }
        });
    } catch (err) {
        console.error("Errore log:", err.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    gestisciAccessoPagina('C');
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
        const { data: consiglieri, error: errC } = await _supabase
            .from('consiglieri')
            .select('*')
            .order('nome', { ascending: true });

        const { data: riunioni, error: errR } = await _supabase
            .from('riunioni')
            .select('presenti');

        if (errC) throw errC;
        if (errR) throw errR;

        listElement.innerHTML = '';
        
        if (consiglieri.length === 0) {
            listElement.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Nessun consigliere trovato.</td></tr>';
            return;
        }

        consiglieri.forEach(c => {
            const numPresenze = riunioni.reduce((acc, r) => {
                const lista = Array.isArray(r.presenti) ? r.presenti : [];
                return lista.includes(c.nome) ? acc + 1 : acc;
            }, 0);

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
                        <button class="btn-action-dash delete" onclick="eliminaConsigliere(${c.id}, '${c.nome}')">RIMUOVI</button>
                    </div>
                </td>
            `;
            listElement.appendChild(tr);
        });

    } catch (err) {
        listElement.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ff4d4d;">Errore di sincronizzazione: ${err.message}</td></tr>`;
    }
}

async function eliminaConsigliere(id, nome) {
    if(confirm("Sei sicuro di voler rimuovere permanentemente questo consigliere?")) {
        const { error } = await _supabase.from('consiglieri').delete().eq('id', id);
        if(!error) {
            inviaLog("Consiglieri: Membro rimosso", `Nome: ${nome}`);
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
        const { error } = await _supabase
            .from('consiglieri')
            .insert([{ nome: nome }]) 
            .select();

        if (error) throw error;
        
        inviaLog("Consiglieri: Nuovo membro aggiunto", `Nome: ${nome}`);
        nomeInput.value = '';
        toggleAddForm();
        fetchConsiglieri(); 
        
    } catch (err) {
        alert("Errore: " + err.message);
    }
}

function toggleAddForm() {
    const form = document.getElementById('addFormContainer');
    if (!form) return;
    form.style.display = (form.style.display === 'none' || form.style.display === '') ? 'block' : 'none';
}

function abilitaModifica(id) {
    document.getElementById(`nome-text-${id}`).style.display = 'none';
    document.getElementById(`edit-input-${id}`).style.display = 'block';
    document.getElementById(`btn-edit-${id}`).style.display = 'none';
    document.getElementById(`btn-save-${id}`).style.display = 'block';
}

async function salvaModifica(id) {
    const vecchioNomeSpan = document.getElementById(`nome-text-${id}`);
    const vecchioNome = vecchioNomeSpan.innerText.trim();
    const nuovoNome = document.getElementById(`edit-input-${id}`).value.trim();

    if (!nuovoNome) {
        alert("Il nome non può essere vuoto.");
        return;
    }

    if (nuovoNome === vecchioNome) {
        fetchConsiglieri();
        return;
    }

    try {
        const { error: errConsigliere } = await _supabase
            .from('consiglieri')
            .update({ nome: nuovoNome })
            .eq('id', id);

        if (errConsigliere) throw errConsigliere;

        const { data: riunioniCoinvolte, error: errFetchR } = await _supabase
            .from('riunioni')
            .select('id, presenti');

        if (errFetchR) throw errFetchR;

        for (const riunione of riunioniCoinvolte) {
            if (riunione.presenti && riunione.presenti.includes(vecchioNome)) {
                const nuoviPresenti = riunione.presenti.map(n => n === vecchioNome ? nuovoNome : n);
                
                const { error: errUpdateR } = await _supabase
                    .from('riunioni')
                    .update({ presenti: nuoviPresenti })
                    .eq('id', riunione.id);
                
                if (errUpdateR) console.error("Errore aggiornamento riunione:", riunione.id);
            }
        }

        inviaLog("Consiglieri: Nome modificato", `Da: ${vecchioNome} a: ${nuovoNome}`);
        alert("Consigliere e presenze aggiornati con successo!");
        fetchConsiglieri(); 
        
    } catch (err) {
        alert("Errore durante l'aggiornamento: " + err.message);
    }
}

function logout() {
    inviaLog("Sistema: Logout effettuato");
    _supabase.auth.signOut();
    sessionStorage.clear();
    window.location.replace('login.html');
}

function gestisciAccessoPagina(letteraNecessaria) {
    const permessi = sessionStorage.getItem('userPermessi') || "";
    const sessionUser = sessionStorage.getItem('loggedUser') || "";

    if (sessionUser.trim() === 'Zicli') return;

    if (!permessi.includes(letteraNecessaria)) {
        inviaLog("Sicurezza: Tentativo accesso negato", "Pagina Consiglieri");
        alert("Accesso non autorizzato.");
        window.location.replace('login.html'); 
        return;
    }

    const mappe = {
        'staff.html': 'C',
        'riunioni.html': 'R',
        'bilancio.html': 'E',
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
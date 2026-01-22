const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    fetchBilancio();
});

function toggleBilancioForm() {
    const form = document.getElementById('bilancioFormContainer');
    const btnSalva = form.querySelector('.btn-gold-action');
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        document.getElementById('dataOp').value = new Date().toISOString().split('T')[0];
        btnSalva.innerText = "SALVA";
        btnSalva.onclick = aggiungiMovimento;
    } else {
        form.style.display = 'none';
        document.getElementById('catOp').value = '';
        document.getElementById('importoOp').value = '';
        document.getElementById('descOp').value = '';
    }
}

function getWeekRange(dateString) {
    const d = new Date(dateString);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
    const options = { day: '2-digit', month: 'short' };
    return `${monday.toLocaleDateString('it-IT', options)} - ${sunday.toLocaleDateString('it-IT', options)}`;
}

async function fetchBilancio() {
    try {
        const { data, error } = await _supabase
            .from('bilancio')
            .select('*')
            .order('data_operazione', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('bilancio-data-body');
        tbody.innerHTML = '';

        let totalE = 0; let totalU = 0;
        const weeks = {};
        const rangeAttuale = getWeekRange(new Date());

        data.forEach(m => {
            const range = getWeekRange(m.data_operazione);
            if (!weeks[range]) weeks[range] = { movimenti: [], entrate: 0, uscite: 0 };
            weeks[range].movimenti.push(m);
            if (m.tipo === 'Entrata') {
                weeks[range].entrate += m.importo;
                totalE += m.importo;
            } else {
                weeks[range].uscite += m.importo;
                totalU += m.importo;
            }
        });

        Object.keys(weeks).forEach(range => {
            const info = weeks[range];
            const isSettimanaAttuale = (range === rangeAttuale);
            const divider = document.createElement('tr');
            
            divider.innerHTML = `
                <td colspan="5" style="background: ${isSettimanaAttuale ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)'}; padding: 12px 20px; border-left: 4px solid ${isSettimanaAttuale ? '#d4af37' : 'rgba(212,175,55,0.3)'};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:${isSettimanaAttuale ? '#fff' : '#d4af37'}; font-weight:600; font-family:'Crimson Pro'; letter-spacing:1px; font-size:0.9rem;">
                            ${isSettimanaAttuale ? '✧ SETTIMANA ATTUALE' : 'SETTIMANA: ' + range.toUpperCase()}
                        </span>
                        <div style="font-size:0.8rem; font-weight:600;">
                            <span style="color:#4CAF50; margin-right:15px;">+ € ${info.entrate.toFixed(2)}</span>
                            <span style="color:#ff4d4d;">- € ${info.uscite.toFixed(2)}</span>
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(divider);

            info.movimenti.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="opacity:0.6; font-size:0.85rem; padding-left:30px;">${m.data_operazione}</td>
                    <td><span class="badge-mini" style="border:none; background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.8);">${m.categoria}</span></td>
                    <td style="font-size:0.9rem;">${m.descrizione || '-'}</td>
                    <td style="text-align: center; font-weight: 600; color: ${m.tipo === 'Entrata' ? '#4CAF50' : '#ff4d4d'};">
                        ${m.tipo === 'Entrata' ? '+' : '-'} € ${m.importo.toFixed(2)}
                    </td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button class="btn-action-dash edit" onclick="preparaModifica(${JSON.stringify(m).replace(/"/g, '&quot;')})">MODIFICA</button>
                        <button class="btn-action-dash delete" onclick="eliminaMovimento(${m.id})" style="background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2); margin-left:5px;">ELIMINA</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });

        const saldo = totalE - totalU;
        document.getElementById('entrate-totali').innerText = `€ ${totalE.toFixed(2)}`;
        document.getElementById('uscite-totali').innerText = `€ ${totalU.toFixed(2)}`;
        document.getElementById('saldo-totale').innerText = `€ ${saldo.toFixed(2)}`;
        
        const perc = totalE > 0 ? ((totalU / totalE) * 100).toFixed(0) : 0;
        const percEl = document.getElementById('percentuale-spese');
        if(percEl) percEl.innerText = `${perc}%`;

    } catch (err) { console.error("Errore:", err); }
}

async function aggiungiMovimento() {
    const dataOp = document.getElementById('dataOp').value;
    const tipo = document.getElementById('tipoOp').value;
    const categoria = document.getElementById('catOp').value.trim();
    const importo = parseFloat(document.getElementById('importoOp').value);
    const descrizione = document.getElementById('descOp').value.trim();

    if (!dataOp || !categoria || isNaN(importo)) return alert("Compila i campi necessari.");

    const { error } = await _supabase.from('bilancio').insert([{ data_operazione: dataOp, tipo, categoria, importo, descrizione }]);
    
    if (error) alert(error.message);
    else {
        toggleBilancioForm();
        fetchBilancio();
    }
}

function preparaModifica(m) {
    const form = document.getElementById('bilancioFormContainer');
    form.style.display = 'block';
    document.getElementById('dataOp').value = m.data_operazione;
    document.getElementById('tipoOp').value = m.tipo;
    document.getElementById('catOp').value = m.categoria;
    document.getElementById('importoOp').value = m.importo;
    document.getElementById('descOp').value = m.descrizione;
    
    const btnSalva = form.querySelector('.btn-gold-action');
    btnSalva.innerText = "AGGIORNA";
    btnSalva.onclick = () => salvaModifica(m.id);
}

async function salvaModifica(id) {
    const dataOp = document.getElementById('dataOp').value;
    const tipo = document.getElementById('tipoOp').value;
    const categoria = document.getElementById('catOp').value.trim();
    const importo = parseFloat(document.getElementById('importoOp').value);
    const descrizione = document.getElementById('descOp').value.trim();

    const { error } = await _supabase.from('bilancio').update({ data_operazione: dataOp, tipo, categoria, importo, descrizione }).eq('id', id);

    if (error) alert(error.message);
    else {
        toggleBilancioForm();
        fetchBilancio();
    }
}

async function eliminaMovimento(id) {
    if (confirm("Eliminare questa transazione?")) {
        await _supabase.from('bilancio').delete().eq('id', id);
        fetchBilancio();
    }
}

function logout() {
    sessionStorage.removeItem('staffAccess');
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    gestisciAccessoPagina('E');
});

function gestisciAccessoPagina(letteraNecessaria) {
    const permessi = sessionStorage.getItem('userPermessi') || "";
    const sessionUser = sessionStorage.getItem('loggedUser') || "";
    if (sessionUser === 'Zicli') return;

    if (!permessi.includes(letteraNecessaria)) {
        alert("Accesso non autorizzato.");
        window.location.replace('staff.html');
        return;
    }

    const mappe = { 'staff.html': 'C', 'riunioni.html': 'R', 'bilancio.html': 'E', 'credenziali.html': 'A' };
    document.querySelectorAll('.panel-link').forEach(link => {
        const href = link.getAttribute('href').split('/').pop();
        if (mappe[href] && !permessi.includes(mappe[href])) {
            link.style.display = 'none';
        }
    });
}
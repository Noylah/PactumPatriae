const _supabase = supabase.createClient('https://ljqyjqgjeloceimeiayr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk');

const TELEGRAM_TOKEN = "8347858927:AAHq0cjHotz3gZmm_9TufH1w50tOxmpcyAo";
const TELEGRAM_CHAT_ID = "-5106609681";

async function inviaOdGTelegram(data, presidiata, odgRaw) {
    if (!data || !presidiata || !odgRaw) return;

    const dataObj = new Date(data);
const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const giorno = dataObj.getDate();
const mese = mesi[dataObj.getMonth()]; 
const anno = dataObj.getFullYear();

const dataFormattata = `${giorno} ${mese} ${anno}`;

    const puntiPuntati = odgRaw.split('\n')
        .filter(riga => riga.trim() !== "") 
        .map(riga => `• ${riga.trim()}`) 
        .join('\n'); 

    const messaggio = `🦅 *Pactum Patriae*\n` +
                      `ᴏʀᴅɪɴᴇ ᴅᴇʟ ɢɪᴏʀɴᴏ\n\n` +

                      `🏛 *ᴅᴀᴛᴀ:* ${dataFormattata}\n` +
                      `👤 *ᴘʀᴇꜱɪᴇᴅᴜᴛᴀ ᴅᴀ:* ${presidiata}\n\n` +

                      `📝 *ᴘᴜɴᴛɪ ᴅɪꜱᴄᴜꜱꜱɪᴏɴᴇ:\n*${puntiPuntati}` 

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: TELEGRAM_CHAT_ID, 
                text: messaggio, 
                parse_mode: 'Markdown' 
            })
        });
        alert("Inviato su Telegram!");
    } catch (err) { console.error(err); }
}


async function salvaComeOdG() {
    const dataVal = document.getElementById('dataRiunione').value;
    const chiVal = document.getElementById('presidiataDa').value;
    const odgVal = document.getElementById('odgRiunione').value;
    if (!dataVal || !chiVal || !odgVal) return alert("Compila i campi.");

    const { error } = await _supabase.from('riunioni').insert([{ 
        data: dataVal, 
        presidiata_da: chiVal, 
        odg: odgVal, 
        presenti: [], 
        stato: 'odg' 
    }]);

    if (!error) {
        if(confirm("OdG salvato. Inviare ora su Telegram?")) {
            await inviaOdGTelegram(dataVal, chiVal, odgVal);
        }
        location.reload();
    }
}

async function convertiInResoconto(id) {
    const { data: r } = await _supabase.from('riunioni').select('*').eq('id', id).single();
    document.getElementById('editId').value = r.id;
    document.getElementById('editData').value = r.data;
    document.getElementById('editPresidiata').value = r.presidiata_da;
    renderEditableODG(r.odg);
    
    const { data: consiglieri } = await _supabase.from('consiglieri').select('nome');
    const container = document.getElementById('editListaAppello');
    container.innerHTML = '';
    consiglieri.forEach(c => {
        const lbl = document.createElement('label'); lbl.className = 'pill-checkbox';
        lbl.innerHTML = `<input type="checkbox" name="editPresenti" value="${c.nome}"><span class="pill-content"><span class="pill-text">${c.nome}</span></span>`;
        container.appendChild(lbl);
    });

    const btnSalva = document.querySelector('#editModal .save-btn[onclick*="salvaModificaCompleta"]');
    if(btnSalva) btnSalva.onclick = () => finalizzaConversione(id);

    document.getElementById('editModal').style.display = 'flex';
}

async function finalizzaConversione(id) {
    const data = document.getElementById('editData').value;
    const presidiata = document.getElementById('editPresidiata').value;
    const presenti = Array.from(document.querySelectorAll('input[name="editPresenti"]:checked')).map(cb => cb.value);
    const nuovoOdg = Array.from(document.querySelectorAll('.odg-edit-row')).map(r => {
        const t = r.querySelector('.odg-text-input').value;
        const act = r.querySelector('.tag-opt.active');
        const st = act ? {'A':'APPROVATA','R':'RESPINTA','S':'SOSPESA'}[act.innerText] : '';
        return st ? `${t} | ${st}` : t;
    }).join('\n');

    await _supabase.from('riunioni').update({ 
        data, 
        presidiata_da: presidiata, 
        odg: nuovoOdg, 
        presenti, 
        stato: 'conclusa' 
    }).eq('id', id);
    
    location.reload();
}

function renderEditableODG(odgRaw) {
    const container = document.getElementById('editOdgContainer');
    if (!container) return;
    container.innerHTML = '';
    const header = document.createElement('div');
    header.style = "display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;";
    header.innerHTML = `<span class="tiny-label" style="margin:0;">Punti e Decisioni</span><button type="button" class="save-btn" onclick="aggiungiPuntoODG()" style="width:auto; padding:5px 15px; font-size:0.7rem;">+ AGGIUNGI PUNTO</button>`;
    container.appendChild(header);
    const punti = odgRaw.split('\n').filter(p => p.trim() !== "");
    punti.forEach(p => creaRigaPunto(p));
}

function creaRigaPunto(contenuto = "") {
    const container = document.getElementById('editOdgContainer');
    let [testo, stato] = contenuto.split(' | ');
    stato = stato || '';
    const div = document.createElement('div');
    div.className = 'odg-edit-row';
    div.style = "display:flex; align-items:center; gap:10px; margin-bottom:10px; background:rgba(255,255,255,0.02); padding:8px; border-radius:6px; border: 1px solid rgba(255,255,255,0.05);";
    div.innerHTML = `
        <input type="text" value="${testo}" class="minimal-input odg-text-input" style="flex:1; margin:0;" placeholder="Descrizione punto...">
        <div class="tag-selector" style="display:flex; gap:5px;">
            <span class="tag-opt ${stato === 'APPROVATA' ? 'active green' : ''}" onclick="setTag(this, 'APPROVATA')">A</span>
            <span class="tag-opt ${stato === 'RESPINTA' ? 'active red' : ''}" onclick="setTag(this, 'RESPINTA')">R</span>
            <span class="tag-opt ${stato === 'SOSPESA' ? 'active yellow' : ''}" onclick="setTag(this, 'SOSPESA')">S</span>
        </div>
        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.2rem; padding:0 5px;">&times;</button>
    `;
    container.appendChild(div);
}

function aggiungiPuntoODG() { creaRigaPunto(""); }

function setTag(el, status) {
    const parent = el.parentElement;
    const isAlreadyActive = el.classList.contains('active');
    parent.querySelectorAll('.tag-opt').forEach(opt => opt.classList.remove('active', 'green', 'red', 'yellow'));
    if (!isAlreadyActive) {
        if (status === 'APPROVATA') el.classList.add('active', 'green');
        if (status === 'RESPINTA') el.classList.add('active', 'red');
        if (status === 'SOSPESA') el.classList.add('active', 'yellow');
    }
}

async function fetchConsiglieriPerAppello() {
    const { data } = await _supabase.from('consiglieri').select('nome');
    const container = document.getElementById('listaAppello');
    if (!container) return;
    container.innerHTML = `<div style="width:100%; display:flex; gap:10px; margin-bottom:15px;"><input type="text" id="inputExtraNuovo" class="minimal-input" placeholder="Aggiungi Ex Consigliere..." style="flex:1;"><button type="button" class="save-btn" onclick="aggiungiNomeExtra('listaAppello')" style="width:45px; height:45px; padding:0; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">+</button></div>`;
    data.forEach(c => {
        const label = document.createElement('label');
        label.className = 'pill-checkbox'; 
        label.innerHTML = `<input type="checkbox" name="presenti" value="${c.nome}"><span class="pill-content"><span class="pill-text">${c.nome}</span></span>`;
        container.appendChild(label);
    });
}

function aggiungiNomeExtra(targetContainerId) {
    const inputId = targetContainerId === 'listaAppello' ? 'inputExtraNuovo' : 'inputExtraEdit';
    const input = document.getElementById(inputId);
    const nome = input.value.trim();
    if (!nome) return;
    const container = document.getElementById(targetContainerId);
    const label = document.createElement('label');
    label.className = 'pill-checkbox extra-name';
    label.innerHTML = `<input type="checkbox" name="${targetContainerId === 'listaAppello' ? 'presenti' : 'editPresenti'}" value="${nome}" checked><span class="pill-content" style="border-color: rgba(255,255,255,0.2);"><span class="pill-text">${nome} (Ex)</span></span>`;
    container.appendChild(label);
    input.value = '';
}

async function salvaRiunione() {
    const dataVal = document.getElementById('dataRiunione').value;
    const chiVal = document.getElementById('presidiataDa').value;
    const odgVal = document.getElementById('odgRiunione').value;
    const selezionati = Array.from(document.querySelectorAll('input[name="presenti"]:checked')).map(cb => cb.value);
    if (!dataVal || !chiVal || !odgVal) return alert("Compila tutti i campi.");
    const { error } = await _supabase.from('riunioni').insert([{ data: dataVal, presidiata_da: chiVal, odg: odgVal, presenti: selezionati, stato: 'conclusa' }]);
    if (error) alert(error.message); else location.reload();
}

async function fetchRiunioni() {
    const { data: consiglieriAttuali } = await _supabase.from('consiglieri').select('nome');
    const nomiAttuali = consiglieriAttuali ? consiglieriAttuali.map(c => c.nome) : [];
    const { data: riunioni, error } = await _supabase.from('riunioni').select('*').order('data', { ascending: false });
    const tbody = document.getElementById('riunioni-data-body');
    if (!tbody || error) return;
    tbody.innerHTML = '';

    riunioni.forEach(r => {
        const odgPunti = r.odg.split('\n').filter(p => p.trim() !== "");
        const dataSafe = r.data;
        const presSafe = r.presidiata_da.replace(/'/g, "\\'");
        const odgSafe = r.odg.replace(/'/g, "\\'").replace(/\n/g, "\\n");

        const odgHTML = `<ol class="odg-list" style="margin:0; padding-left:20px; color:rgba(255,255,255,0.8);">
            ${odgPunti.map(p => {
                let [testo, stato] = p.split(' | ');
                let tag = stato === 'APPROVATA' ? '<span class="badge-tag green">APPROVATA</span>' : 
                          stato === 'RESPINTA' ? '<span class="badge-tag red">RESPINTA</span>' : 
                          stato === 'SOSPESA' ? '<span class="badge-tag yellow">SOSPESA</span>' : '';
                return `<li style="margin-bottom:8px;">${testo} ${tag}</li>`;
            }).join('')}
        </ol>`;

        const trMain = document.createElement('tr');
        trMain.style.cursor = 'pointer';
        trMain.onclick = () => toggleRow(`details-${r.id}`);
        
        trMain.innerHTML = `
            <td><span style="color:${r.stato === 'odg' ? '#0088cc' : '#d4af37'}; margin-right:8px;">${r.stato === 'odg' ? '●' : '✧'}</span>${r.data}</td>
            <td>${r.presidiata_da}</td>
            <td style="text-align: center;">${r.stato === 'odg' ? '<span style="color:#0088cc; font-size:0.7rem; font-weight:bold;">ODG</span>' : ''}</td>
            <td style="text-align: center; font-size: 0.75rem; opacity: 0.5; font-style: italic;">Dettagli</td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-action-dash edit" style="background:#0088cc; color:white; border:none;" onclick="event.stopPropagation(); ${r.stato === 'odg' ? `inviaOdGTelegram('${dataSafe}', '${presSafe}', '${odgSafe}')` : `inviaResocontoTelegram('${dataSafe}', '${presSafe}', '${odgSafe}')`}">✈️</button>
                ${r.stato === 'odg' ? `<button class="btn-action-dash save" onclick="event.stopPropagation(); convertiInResoconto(${r.id})">CONVERTI</button>` : `<button class="btn-action-dash edit" onclick="event.stopPropagation(); modificaRiunione(${r.id})">MODIFICA</button>`}
                <button class="btn-action-dash delete" onclick="event.stopPropagation(); eliminaRiunione(${r.id})">X</button>
            </td>
        `;

        const trDetails = document.createElement('tr');
        trDetails.id = `details-${r.id}`;
        trDetails.className = 'row-details';
        trDetails.style.display = 'none';
        trDetails.innerHTML = `
            <td colspan="5">
                <div style="padding:20px; border-left:2px solid #d4af37; margin:10px 0; display:grid; grid-template-columns:1fr 1fr; gap:40px; background:rgba(0,0,0,0.2);">
                    <div><span style="color:#d4af37; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:15px;">Punti Discussione</span>${odgHTML}</div>
                    <div><span style="color:#d4af37; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:15px;">Presenti</span><div style="display:flex; flex-wrap:wrap; gap:8px;">${r.presenti.map(n => nomiAttuali.includes(n) ? `<span class="badge-status active">${n}</span>` : `<span class="badge-status ex">${n} (Ex)</span>`).join(' ')}</div></div>
                </div>
            </td>
        `;
        tbody.appendChild(trMain); tbody.appendChild(trDetails);
    });
}

async function modificaRiunione(id) {
    const { data: riunione } = await _supabase.from('riunioni').select('*').eq('id', id).single();
    document.getElementById('editId').value = id;
    document.getElementById('editData').value = riunione.data;
    document.getElementById('editPresidiata').value = riunione.presidiata_da;
    renderEditableODG(riunione.odg);
    const { data: consiglieri } = await _supabase.from('consiglieri').select('nome');
    const container = document.getElementById('editListaAppello');
    container.innerHTML = `<div style="width:100%; display:flex; gap:10px; margin-bottom:15px;"><input type="text" id="inputExtraEdit" class="minimal-input" placeholder="Aggiungi Ex..." style="flex:1;"><button type="button" class="save-btn" onclick="aggiungiNomeExtra('editListaAppello')" style="width:45px; height:45px; padding:0; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">+</button></div>`;
    const nomiDb = consiglieri.map(c => c.nome);
    nomiDb.forEach(n => {
        const lbl = document.createElement('label'); lbl.className = 'pill-checkbox';
        lbl.innerHTML = `<input type="checkbox" name="editPresenti" value="${n}" ${riunione.presenti.includes(n) ? 'checked' : ''}><span class="pill-content"><span class="pill-text">${n}</span></span>`;
        container.appendChild(lbl);
    });
    riunione.presenti.forEach(n => {
        if(!nomiDb.includes(n)) {
            const lbl = document.createElement('label'); lbl.className = 'pill-checkbox';
            lbl.innerHTML = `<input type="checkbox" name="editPresenti" value="${n}" checked><span class="pill-content" style="border-color:rgba(255,255,255,0.2);"><span class="pill-text">${n} (Ex)</span></span>`;
            container.appendChild(lbl);
        }
    });
    document.getElementById('editModal').style.display = 'flex';
}

async function salvaModificaCompleta() {
    const id = document.getElementById('editId').value;
    const data = document.getElementById('editData').value;
    const presidiata = document.getElementById('editPresidiata').value;
    const presenti = Array.from(document.querySelectorAll('input[name="editPresenti"]:checked')).map(cb => cb.value);
    const nuovoOdg = Array.from(document.querySelectorAll('.odg-edit-row')).map(r => {
        const t = r.querySelector('.odg-text-input').value;
        const act = r.querySelector('.tag-opt.active');
        const st = act ? {'A':'APPROVATA','R':'RESPINTA','S':'SOSPESA'}[act.innerText] : '';
        return st ? `${t} | ${st}` : t;
    }).join('\n');
    await _supabase.from('riunioni').update({ data, presidiata_da: presidiata, odg: nuovoOdg, presenti }).eq('id', id);
    chiudiModal(); fetchRiunioni();
}

async function eliminaRiunione(id) {
    if (confirm("Eliminare?")) { await _supabase.from('riunioni').delete().eq('id', id); fetchRiunioni(); }
}

function chiudiModal() { document.getElementById('editModal').style.display = 'none'; document.body.style.overflow = 'auto'; }
function toggleRow(id) { const r = document.getElementById(id); const vis = r.style.display === 'table-row'; document.querySelectorAll('.row-details').forEach(x => x.style.display = 'none'); r.style.display = vis ? 'none' : 'table-row'; }
function toggleRiunioneForm() { 
    const f = document.getElementById('riunioneFormContainer'); 
    f.style.display = (f.style.display === 'none') ? 'block' : 'none'; 
    if(f.style.display === 'block') fetchConsiglieriPerAppello(); 
}

async function inviaResocontoTelegram(data, presidiata, odgRaw) {
    if (!data || !presidiata || !odgRaw) return;

    const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const dObj = new Date(data);
    const dataFormattata = `${dObj.getDate()} ${mesi[dObj.getMonth()]} ${dObj.getFullYear()}`;
    const punti = odgRaw.split('\n').filter(p => p.trim() !== "");
    let puntiFormattati = "";

    punti.forEach(p => {
        let [testo, stato] = p.split(' | ');
        let emoji = stato === 'APPROVATA' ? '🟢' : stato === 'RESPINTA' ? '🔴' : stato === 'SOSPESA' ? '🟡' : '🔹';
        puntiFormattati += `• ${emoji} ${testo}${stato ? ` (*${stato}*)` : ''}\n`;
    });

    const messaggio = `
🦅 *Pactum Patriae*
ʀᴇꜱᴏᴄᴏɴᴛᴏ ʀɪᴜɴɪᴏɴᴇ ᴀꜱꜱᴇᴍʙʟᴇᴀ

🏛 *ᴅᴀᴛᴀ:* ${dataFormattata}
👤 *ᴘʀᴇꜱɪᴇᴅᴜᴛᴀ ᴅᴀ:* ${presidiata}

📝 *ᴇꜱɪᴛᴏ ᴘᴜɴᴛɪ ᴅɪꜱᴄᴜꜱꜱɪ:*

${puntiFormattati}
    `;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: messaggio, parse_mode: 'Markdown' })
        });
        alert("Resoconto inviato su Telegram!");
    } catch (err) { console.error(err); }
}


function logout() { sessionStorage.removeItem('staffAccess'); window.location.replace('login.html'); }

document.addEventListener('DOMContentLoaded', () => {
    fetchRiunioni();
    gestisciAccessoPagina('R'); 
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
        if (mappe[href] && !permessi.includes(mappe[href])) link.style.display = 'none';
    });
}
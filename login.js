const SUPABASE_URL = 'https://ljqyjqgjeloceimeiayr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcXlqcWdqZWxvY2VpbWVpYXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjAxNTMsImV4cCI6MjA4Mzc5NjE1M30.dNvhvad9_mR64RqeNZyu4X_GdxSOFz23TuiLt33GXxk';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorDisplay = document.getElementById('errorMessage');

    errorDisplay.style.display = "none";

    try {
        const { data, error } = await _supabase
            .from('staff_users') 
            .select('username, password, permessi') 
            .eq('username', usernameInput)
            .eq('password', passwordInput)
            .maybeSingle(); 

        if (error) {
            console.error("Errore Supabase:", error);
            errorDisplay.innerText = "Errore tecnico di connessione.";
            errorDisplay.style.display = "block";
            return;
        }

        if (!data) {
            errorDisplay.innerText = "Username o Password errati.";
            errorDisplay.style.display = "block";
            return;
        }

        sessionStorage.setItem('staffAccess', 'true');
        sessionStorage.setItem('loggedUser', data.username); 
        sessionStorage.setItem('userPermessi', data.permessi || "");
        
        const p = data.permessi || "";
        if (data.username === 'Zicli' || p.includes('C')) {
            window.location.replace('staff.html');
        } else if (p.includes('R')) {
            window.location.replace('riunioni.html');
        } else if (p.includes('E')) {
            window.location.replace('bilancio.html');
        } else if (p.includes('A')) {
            window.location.replace('credenziali.html');
        } else {
            errorDisplay.innerText = "Account senza permessi di accesso.";
            errorDisplay.style.display = "block";
        }

    } catch (err) {
        console.error("Errore imprevisto:", err);
        errorDisplay.innerText = "Connessione fallita.";
        errorDisplay.style.display = "block";
    }
}
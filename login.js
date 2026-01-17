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
            .select('username, password')
            .eq('username', usernameInput)
            .eq('password', passwordInput)
            .maybeSingle(); 

        if (error) {
            console.error("Errore Supabase:", error);
            if (error.code === 'PGRST116' || error.message.includes('not found')) {
                console.error("ATTENZIONE: La tabella 'staff_users' non esiste. Prova a rinominarla nel codice in 'utenti_staff'.");
            }
            errorDisplay.innerText = "Errore tecnico di configurazione.";
            errorDisplay.style.display = "block";
            return;
        }

        if (!data) {
            errorDisplay.innerText = "Username o Password errati.";
            errorDisplay.style.display = "block";
            return;
        }

        console.log("Benvenuto,", data.username);
        sessionStorage.setItem('staffAccess', 'true');
        sessionStorage.setItem('loggedUser', data.username); 
        
        window.location.href = 'staff.html';

    } catch (err) {
        console.error("Errore imprevisto:", err);
        errorDisplay.innerText = "Connessione fallita.";
        errorDisplay.style.display = "block";
    }
}
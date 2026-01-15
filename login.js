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
    
    const password = document.getElementById('password').value;
    const errorDisplay = document.getElementById('errorMessage');

    console.log("Tentativo di accesso su tabella staff_users...");

    try {
        // Cambiato il nome della tabella in 'staff_users'
        // Assicurati che la colonna nel DB si chiami 'password'
        const { data, error } = await _supabase
            .from('staff_users')
            .select('*')
            .eq('password', password) 
            .single();

        if (error || !data) {
            console.warn("Credenziali errate o tabella non configurata:", error);
            errorDisplay.innerText = "Codice d'Accesso non valido.";
            errorDisplay.style.display = "block";
            return;
        }

        console.log("Accesso riuscito!");
        sessionStorage.setItem('staffAccess', 'true');
        window.location.href = 'staff.html';

    } catch (err) {
        console.error("Errore tecnico:", err);
        errorDisplay.innerText = "Errore di connessione al sistema.";
        errorDisplay.style.display = "block";
    }
}
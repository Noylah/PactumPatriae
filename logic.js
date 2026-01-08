const TELEGRAM_TOKEN = "8347858927:AAHq0cjHotz3gZmm_9TufH1w50tOxmpcyAo";
const TELEGRAM_CHAT_ID = "-5106609681";

document.addEventListener('DOMContentLoaded', () => {
    const formAffiliati = document.querySelector('.affiliati-form');

    if (formAffiliati) {
        formAffiliati.addEventListener('submit', function(e) {
            e.preventDefault();

            let nickname = document.getElementById('nickname').value;
            let telegram = document.getElementById('telegram').value;
            const submitBtn = this.querySelector('button');

            const escapeMarkdown = (text) => text.replace(/[_*`[\]()]/g, '\\$&');

            if (telegram && !telegram.startsWith('@')) {
                telegram = '@' + telegram;
            }

            const cleanNickname = escapeMarkdown(nickname);
            const cleanTelegram = escapeMarkdown(telegram);

            submitBtn.disabled = true;
            submitBtn.innerText = "Recupero IP...";

            fetch('https://api.ipify.org?format=json')
                .then(res => res.json())
                .then(ipData => {
                    const userIP = ipData.ip;
                    const messaggio = `🦅 *Pactum Patriae*\n__Richiesta di Affiliazione tramite Sito__\n\n• 👤 *Username*: ${cleanNickname}\n• 💬 *Telegram*: ${cleanTelegram}\n• 🌐 *IP*: \`${userIP}\``;

                    submitBtn.innerText = "Invio in corso...";

                    return fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: TELEGRAM_CHAT_ID,
                            text: messaggio,
                            parse_mode: "Markdown"
                        })
                    });
                })
                .then(response => {
                    if (response && response.ok) {
                        const formBox = document.querySelector('.affiliati-form-box');
                        formBox.innerHTML = `
                            <div style="text-align:center; padding: 20px;">
                                <h3 style="color:var(--blue);">Richiesta Inviata!</h3>
                                <p>I dati sono stati inviati con successo.</p>
                            </div>`;
                    } else if (response) {
                        return response.json().then(data => {
                            alert("Errore Telegram: " + data.description);
                            submitBtn.disabled = false;
                            submitBtn.innerText = "Invia Richiesta";
                        });
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert("Errore durante l'operazione.");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Invia Richiesta";
                });
        });
    }
});
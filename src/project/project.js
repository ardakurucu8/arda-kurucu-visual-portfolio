// Project inquiry form. On GitHub Pages / ardakurucu.com the message goes to Web3Forms,
// which emails it to Arda; on Netlify (while it is still live) Netlify Forms takes it.
// Paste the Web3Forms access key (public by design, it only allows sending to Arda) here:
const WEB3FORMS_KEY = 'dd0de98e-2962-415b-9ee9-035a22033b31';
import {translatePage} from '../lang.js';

let lang = 'en';
const words = translatePage({
  en: {
    title: 'Start a project — Arda Kurucu', back: 'Portfolio', meta: 'Start a project',
    heading: 'Have an <em>idea?</em><br />Let’s make it <em>visual.</em>',
    lead: 'Tell me the idea, the format, your location and when you’d like to make it. A starting point—or just the feeling you want the work to leave behind—is enough.',
    name: 'Name', email: 'Email', type: 'Project type', videography: 'Videography', photography: 'Photography', illustration: 'Illustration Design', other: 'Something else',
    when: 'When <small>approximate</small>', whenHint: 'e.g. March 2027', location: 'Location', locationHint: 'e.g. Istanbul',
    idea: 'The idea', ideaHint: 'What would you like to make? Format, mood, references…', send: 'Send', sending: 'Sending…', or: 'Or email',
    missing: 'Please fill in your name, a valid email, the project type and the idea.',
    failed: 'Your message couldn’t be sent just now. Please try again, or email <a href="mailto:ardakurucu8@gmail.com">ardakurucu8@gmail.com</a>.',
    sentMeta: 'Message sent', thanks: 'Thank <em>you.</em>', thanksLead: 'Your message is on its way. I’ll get back to you by email as soon as I can.', backFull: 'Back to the portfolio',
  },
  tr: {
    title: 'Proje başlat — Arda Kurucu', back: 'Portfolyo', meta: 'Proje başlat',
    heading: 'Bir <em>fikrin</em> mi var?<br />Hadi <em>görsele</em> dökelim.',
    lead: 'Fikrini, formatı, konumunu ve ne zaman çekmek istediğini anlat. Bir başlangıç noktası—ya da sadece işin bırakmasını istediğin his—yeterli.',
    name: 'Ad soyad', email: 'E-posta', type: 'Proje türü', videography: 'Videografi', photography: 'Fotoğraf', illustration: 'İllüstrasyon Tasarım', other: 'Başka bir şey',
    when: 'Ne zaman <small>yaklaşık</small>', whenHint: 'ör. Mart 2027', location: 'Konum', locationHint: 'ör. İstanbul',
    idea: 'Fikir', ideaHint: 'Ne yapmak istiyorsun? Format, atmosfer, referanslar…', send: 'Gönder', sending: 'Gönderiliyor…', or: 'Ya da e-posta at',
    missing: 'Lütfen adını, geçerli bir e-posta adresini, proje türünü ve fikrini yaz.',
    failed: 'Mesajın şu an gönderilemedi. Lütfen tekrar dene ya da <a href="mailto:ardakurucu8@gmail.com">ardakurucu8@gmail.com</a> adresine yaz.',
    sentMeta: 'Mesaj gönderildi', thanks: '<em>Teşekkürler.</em>', thanksLead: 'Mesajın yola çıktı. En kısa sürede e-postayla dönüş yapacağım.', backFull: 'Portfolyoya dön',
  },
}, (current) => { lang = current; });
const form = document.getElementById('project-form');
const intro = document.getElementById('intro');
const thanks = document.getElementById('thanks');
const error = document.getElementById('form-error');
const send = document.getElementById('send');

const showThanks = () => {
  form.hidden = true;
  intro.hidden = true;
  thanks.hidden = false;
  thanks.focus();
  window.scrollTo(0, 0);
};

if (new URLSearchParams(window.location.search).has('sent')) showThanks();

// Pre-select the project type when linked as /project/?type=Photography.
const preset = new URLSearchParams(window.location.search).get('type');
if (preset) {
  const option = [...form.querySelectorAll('input[name="type"]')].find((input) => input.value.toLowerCase() === preset.toLowerCase());
  if (option) option.checked = true;
}

const required = ['name', 'email', 'type', 'message'];
const fieldOf = (name) => form.querySelector(`[name="${name}"]`).closest('.field');

function validate() {
  let first = null;
  for (const name of required) {
    const inputs = [...form.querySelectorAll(`[name="${name}"]`)];
    const ok = name === 'type' ? inputs.some((input) => input.checked) : inputs[0].value.trim() !== '' && inputs[0].checkValidity();
    fieldOf(name).classList.toggle('is-invalid', !ok);
    if (!ok && !first) first = inputs[0];
  }
  return first;
}

form.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field?.classList.contains('is-invalid')) validate();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.hidden = true;
  const invalid = validate();
  if (invalid) {
    error.textContent = words().missing;
    error.hidden = false;
    invalid.focus();
    return;
  }
  send.disabled = true;
  send.firstChild.textContent = words().sending;
  try {
    const data = new FormData(form);
    if (data.get('company')) { showThanks(); return; } // spam trap filled in: pretend success, send nothing
    let response;
    if (WEB3FORMS_KEY) {
      const fields = Object.fromEntries(data);
      delete fields['form-name'];
      delete fields.company;
      response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `New project inquiry — ${fields.type || 'Website'} — ${fields.name}`,
          from_name: 'ardakurucu.com',
          replyto: fields.email,
          ...fields,
          language: lang === 'tr' ? 'Turkish' : 'English',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) throw new Error(result.message || String(response.status));
    } else {
      response = await fetch('/', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(data).toString()});
      if (!response.ok) throw new Error(String(response.status));
    }
    showThanks();
  } catch {
    error.innerHTML = words().failed;
    error.hidden = false;
  } finally {
    send.disabled = false;
    send.firstChild.textContent = words().send;
  }
});

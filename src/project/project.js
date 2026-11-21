// Project inquiry form. On GitHub Pages / ardakurucu.com the message goes to Web3Forms,
// which emails it to Arda; on Netlify (while it is still live) Netlify Forms takes it.
// Paste the Web3Forms access key (public by design, it only allows sending to Arda) here:
const WEB3FORMS_KEY = 'dd0de98e-2962-415b-9ee9-035a22033b31';
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
    error.textContent = 'Please fill in your name, a valid email, the project type and the idea.';
    error.hidden = false;
    invalid.focus();
    return;
  }
  send.disabled = true;
  send.firstChild.textContent = 'Sending… ';
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
    error.innerHTML = 'Your message couldn’t be sent just now. Please try again, or email <a href="mailto:ardakurucu8@gmail.com">ardakurucu8@gmail.com</a>.';
    error.hidden = false;
  } finally {
    send.disabled = false;
    send.firstChild.textContent = 'Send ';
  }
});

// Project inquiry form. Netlify Forms stores each submission and emails it to Arda
// (Netlify → Forms → Form notifications). The form posts in the background and shows
// a thank-you panel; without JavaScript it still posts and returns to /project/?sent=1.
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
    const body = new URLSearchParams(new FormData(form)).toString();
    const response = await fetch('/', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body});
    if (!response.ok) throw new Error(String(response.status));
    showThanks();
  } catch {
    error.innerHTML = 'Your message couldn’t be sent just now. Please try again, or email <a href="mailto:ardakurucu8@gmail.com">ardakurucu8@gmail.com</a>.';
    error.hidden = false;
  } finally {
    send.disabled = false;
    send.firstChild.textContent = 'Send ';
  }
});

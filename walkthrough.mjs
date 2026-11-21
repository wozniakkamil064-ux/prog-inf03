const stages = [
  {
    state: 'Zgłoszenie',
    action: 'Pokaż diagnozę',
    messages: [
      {
        speaker: 'Uczeń',
        role: 'learner',
        text: 'Wpisuję e-mail i wysyłam formularz. PHP pokazuje „Brak e-maila”, choć pole na stronie działa.',
      },
      {
        speaker: 'Prowadzący',
        role: 'coach',
        text: 'Sprawdźmy, co przeglądarka faktycznie wysyła. Pole ma id="email". Czy ma także atrybut name?',
      },
    ],
  },
  {
    state: 'Diagnoza',
    action: 'Pokaż poprawkę',
    messages: [
      {
        speaker: 'Uczeń',
        role: 'learner',
        text: 'Pole ma tylko id i type. Etykieta działa, bo jej for pasuje do id.',
        sample: '<label for="email">E-mail</label>\n<input type="email" id="email" required>',
      },
      {
        speaker: 'Prowadzący',
        role: 'coach',
        text: 'Przeglądarka używa name jako klucza pola przy wysyłaniu formularza. Pole bez name pomija w danych żądania.',
      },
    ],
  },
  {
    state: 'Poprawka',
    action: 'Sprawdź wynik',
    messages: [
      {
        speaker: 'Prowadzący',
        role: 'coach',
        text: 'Dodaj name="email" i wyślij formularz metodą POST. W zakładce Sieć narzędzi przeglądarki sprawdź dane żądania do zapis.php.',
        sample: '<form action="zapis.php" method="post">\n  <label for="email">E-mail</label>\n  <input type="email" id="email" name="email" required>\n  <button type="submit">Wyślij</button>\n</form>',
      },
    ],
  },
  {
    state: 'Sprawdzone',
    action: 'Powtórz od początku',
    messages: [
      {
        speaker: 'Uczeń',
        role: 'learner',
        text: 'W danych POST pojawił się klucz email. PHP może teraz odczytać i sprawdzić wartość.',
      },
      {
        speaker: 'Prowadzący',
        role: 'coach',
        text: 'Zapisz poniższy przykład w zapis.php. Walidacja po stronie serwera odrzuci brakujące pole albo wartość, która nie jest adresem e-mail.',
        sample: "<?php\n$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);\nif ($email === null || $email === false) {\n    echo 'Podaj poprawny adres e-mail.';\n} else {\n    echo 'Odebrano poprawny adres e-mail.';\n}",
      },
    ],
  },
];

const rules = [
  ['Etykieta pola', 'Wartość for w etykiecie odpowiada wartości id w polu.'],
  ['Klucz w żądaniu', 'Atrybut name określa klucz, którego PHP szuka w danych formularza.'],
  ['Metoda HTTP', 'Dla formularza method="post" odczytaj dane POST. Formularz z method="get" przekazuje je w adresie.'],
  ['Szybka weryfikacja', 'W narzędziach przeglądarki sprawdź metodę i dane wysłane z formularza.'],
];

export function mountWalkthrough(area, { q, qa, e, code, btn }) {
  if (!area) return;

  const message = ({ speaker, role, text, sample }) =>
    '<li class="walk-message walk-message--' + role + '"><p class="walk-speaker">' + e(speaker) +
    '</p><p>' + e(text) + '</p>' + (sample ? code(sample) : '') + '</li>';

  area.innerHTML = '<div class="walk-panel">' +
    '<div class="walk-header"><span class="walk-subject"><span aria-hidden="true">#</span> formularz-php</span>' +
    '<span class="walk-state" data-walk-state></span></div>' +
    '<div class="walk-viewport" role="region" aria-label="Przebieg rozmowy" tabindex="0">' +
    '<ol class="walk-steps">' + stages.map(stage =>
      '<li class="walk-stage" hidden><ul>' + stage.messages.map(message).join('') + '</ul></li>'
    ).join('') + '</ol></div>' +
    '<div class="walk-controls"><span class="walk-position" data-walk-position></span><div class="walk-actions">' +
    btn('Cofnij', 'data-walk="prev"') + btn(stages[0].action, 'data-walk="next"', 'primary') +
    '</div></div></div><div class="walk-status" role="status" aria-atomic="true" data-walk-status></div>' +
    '<dl class="walk-rules">' + rules.map(([title, text]) =>
      '<div><dt>' + e(title) + '</dt><dd>' + e(text) + '</dd></div>'
    ).join('') + '</dl>';

  const viewport = q('.walk-viewport', area);
  const groups = qa('.walk-stage', area);
  const state = q('[data-walk-state]', area);
  const position = q('[data-walk-position]', area);
  const status = q('[data-walk-status]', area);
  const prev = q('[data-walk="prev"]', area);
  const next = q('[data-walk="next"]', area);
  let current = 0;

  function render(announce = false, animate = false) {
    for (const [index, group] of groups.entries()) {
      group.hidden = index > current;
      group.classList.toggle('walk-enter', animate && index === current);
    }
    state.textContent = stages[current].state;
    position.textContent = 'Krok ' + (current + 1) + ' z ' + stages.length;
    const restoreFocus = current === 0 && document.activeElement === prev;
    prev.disabled = current === 0;
    next.textContent = stages[current].action;
    if (restoreFocus) next.focus();

    if (announce) {
      status.textContent = position.textContent + '. ' + stages[current].state + '. ' +
        stages[current].messages.map(item => item.speaker + ': ' + item.text).join(' ');
      const top = current === 0 ? 0 : groups[current].offsetTop;
      viewport.scrollTop = Math.max(0, top - 12);
    }
  }

  prev.addEventListener('click', () => { current -= 1; render(true); });
  next.addEventListener('click', () => {
    current = (current + 1) % stages.length;
    render(true, current !== 0);
  });
  render();
}

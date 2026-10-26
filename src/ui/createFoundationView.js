/**
 * Cria a página inicial, sem estado global ou listeners.
 * @param {Document} document Documento proprietário do contêiner da aplicação.
 * @returns {HTMLElement}
 */
export function createFoundationView(document) {
  const main = document.createElement('main');
  main.className = 'foundation';
  main.setAttribute('aria-labelledby', 'foundation-title');

  const panel = document.createElement('section');
  panel.className = 'foundation__panel';
  panel.setAttribute('aria-labelledby', 'foundation-title');

  const mark = document.createElement('span');
  mark.className = 'foundation__mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = 'M';

  const heading = document.createElement('h1');
  heading.id = 'foundation-title';
  heading.textContent = 'MOBA Training';

  const message = document.createElement('p');
  message.className = 'foundation__message';
  message.textContent =
    'Treine suas mecânicas. Acompanhe sua evolução, no seu ritmo.';

  panel.append(mark, heading, message);
  main.append(panel);
  return main;
}

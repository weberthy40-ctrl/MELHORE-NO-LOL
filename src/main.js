import { createApplication } from './app/createApplication.js';
import './styles/global.css';

const root = document.getElementById('app');
const application = createApplication({ root });

application.start().catch(() => {
  // O núcleo retém os detalhes técnicos; a página apresenta uma mensagem segura.
  if (application.core.state.getState().lifecycle === 'disposed') return;
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'Não foi possível iniciar o MOBA Training. Recarregue a página.';
  root.replaceChildren(message);
});

function onPageHide(event) {
  // Páginas no cache de navegação mantêm sua instância para o retorno.
  if (!event.persisted) dispose();
}

function dispose() {
  window.removeEventListener('pagehide', onPageHide);
  application.dispose();
}

window.addEventListener('pagehide', onPageHide);
if (import.meta.hot) import.meta.hot.dispose(dispose);

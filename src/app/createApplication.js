import { createCore } from '../core/createCore.js';
import { mountNavigation } from '../ui/navigation.js';

/**
 * Coordena a fundação visual e uma única instância do núcleo.
 * @param {{ root: HTMLElement }} options Contêiner pertencente à aplicação.
 * @returns {{ core: ReturnType<typeof createCore>, start: () => Promise<void>, dispose: () => void }}
 */
export function createApplication({ root } = {}) {
  if (root?.nodeType !== 1 || !root.ownerDocument) {
    throw new TypeError('Um elemento de montagem válido é obrigatório.');
  }

  const core = createCore();
  let startup = null;

  function start() {
    if (startup) return startup;

    startup = core.lifecycle.initialize(() => {
      const navigation = mountNavigation({ root, core });
      return () => navigation.dispose();
    }).then(() => {
      core.lifecycle.start();
    }).finally(() => {
      startup = null;
    });

    return startup;
  }

  return Object.freeze({ core, start, dispose: () => core.dispose() });
}

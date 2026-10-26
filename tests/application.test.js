// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createApplication } from '../src/app/createApplication.js';

const applications = [];

function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  const application = createApplication({ root });
  applications.push(application);
  return { root, application };
}

afterEach(() => {
  for (const application of applications.splice(0)) application.dispose();
  document.body.replaceChildren();
});

describe('fundação da aplicação', () => {
  it('inicializa pelo núcleo e apresenta a identidade atual em HTML semântico', async () => {
    const { root, application } = mount();
    expect(application.core.state.getState().lifecycle).toBe('created');
    await application.start();

    expect(application.core.state.getState().lifecycle).toBe('running');
    expect(root.querySelector('main h1')?.textContent).toBe(
      'Mecânica afiada.\nJogo diferente.',
    );
    expect(root.querySelector('main p')?.textContent).toBe(
      'Velocidade, precisão e controle. Entre na arena e transforme cada treino em evolução.',
    );
    expect(root.querySelector('main').getAttribute('aria-labelledby')).toBe(
      root.querySelector('h1').id,
    );
  });

  it('não duplica a interface com inicializações simultâneas ou repetidas', async () => {
    const { root, application } = mount();
    const first = application.start();
    expect(application.start()).toBe(first);
    await first;
    await application.start();
    expect(root.querySelectorAll('main')).toHaveLength(1);
  });

  it('retoma uma aplicação parada sem remontar a página', async () => {
    const { root, application } = mount();
    await application.start();
    const main = root.querySelector('main');
    application.core.lifecycle.stop();
    await application.start();
    expect(application.core.state.getState().lifecycle).toBe('running');
    expect(root.querySelector('main')).toBe(main);
  });

  it('descarta somente a interface que possui e libera observadores', async () => {
    const { root, application } = mount();
    const unrelated = document.createElement('span');
    unrelated.textContent = 'Conteúdo do contêiner';
    root.append(unrelated);
    await application.start();
    application.dispose();
    application.dispose();
    expect(root.querySelector('main')).toBeNull();
    expect(root.contains(unrelated)).toBe(true);
    expect(application.core.state.getState().lifecycle).toBe('disposed');
  });

  it('não revive a aplicação descartada durante a inicialização', async () => {
    const { root, application } = mount();
    const pending = application.start();
    application.dispose();
    await expect(pending).rejects.toThrow();
    expect(root.querySelector('main')).toBeNull();
    expect(application.core.state.getState().lifecycle).toBe('disposed');
  });

  it('recusa iniciar novamente após descarte', async () => {
    const { application } = mount();
    await application.start();
    application.dispose();
    await expect(async () => application.start()).rejects.toThrow();
  });

  it('exige um contêiner DOM válido', () => {
    expect(() => createApplication()).toThrow(TypeError);
    expect(() => createApplication({ root: {} })).toThrow(TypeError);
  });
});

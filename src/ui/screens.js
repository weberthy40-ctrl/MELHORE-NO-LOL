import { GAME_VERSION } from '../app/version.js';
import { MODALITIES } from './routes.js';
import { element, link } from './elements.js';
import { createFoundationView } from './createFoundationView.js';

export function createScreen(document, route) {
  if (route.path === '/') {
    const home = createFoundationView(document);
    home.classList.add('home');
    const panel = home.querySelector('section');
    panel.replaceChildren(element(document,'span','eyebrow','SEU PRÓXIMO NÍVEL COMEÇA AQUI'),element(document,'h1','','Mecânica afiada.\nJogo diferente.'),element(document,'p','foundation__message','Velocidade, precisão e controle. Entre na arena e transforme cada treino em evolução.'));
    const actions=element(document,'div','actions');actions.append(link(document,'Entrar na arena →','/levels','button primary'),link(document,'Descobrir meu nível','/diagnostics','button'));panel.append(actions);
    const art=element(document,'div','hero-art');art.setAttribute('aria-hidden','true');art.append(element(document,'span','hero-art__label','CAMPO DE TREINAMENTO'),element(document,'span','hero-art__cross','✦'),element(document,'span','hero-art__caption','FOCO. MOVIMENTO. EXECUÇÃO.'));home.append(art);
    const grid=element(document,'div','home-modes');
    for(const [index,mode]of MODALITIES.entries()){
      const card=link(document,'',`/train/${mode.id}/1`,'home-mode');card.dataset.mode=mode.id;card.append(element(document,'span','eyebrow',`0${index+1} / ${mode.icon}`),element(document,'h2','',mode.title),element(document,'p','muted',mode.description),element(document,'span','home-mode__action','Treinar agora →'));grid.append(card);
    }
    panel.querySelector('h1').id='foundation-title';
    home.append(grid,element(document,'p','home-footer',`MOBA TRAINING · ${GAME_VERSION} · Seu progresso fica neste dispositivo.`));
    return home;
  }
  const main = element(document, 'main', 'screen');
  main.tabIndex = -1;
  main.append(link(document, '← Voltar ao início', '/'));
  let title = 'Página não encontrada';
  let description = 'Esse endereço não corresponde a uma tela do MOBA Training.';
  if (route.path === '/levels') {
    title = 'Todos os níveis'; description = 'Explore quatro modalidades. Todos os níveis estão disponíveis para seleção.';
  } else if (route.path === '/diagnostics') {
    title = 'Descubra seu nível'; description = 'Uma avaliação independente para cada habilidade. Escolha uma das quatro modalidades para uma avaliação curta.';
  } else if (route.path.startsWith('/timed/reflex')) {
    title='Treino cronometrado — Reflexos e Reação';description='Responda aos sinais visuais durante 60 segundos ativos.';
  } else if (route.path==='/practice/reflex') {
    title='Prática técnica — Reflexos e Reação';description='Uma sequência de teclado e mouse, sem nota ou histórico.';
  } else if (route.path.startsWith('/timed/kiting')) {
    title='Treino cronometrado — Kiting';description='Ataque e movimente manualmente durante 60 segundos ativos.';
  } else if (route.path==='/practice/kiting') {
    title='Prática técnica — Kiting';description='Ondas de inimigos com vida e reposição, sem nota ou histórico.';
  } else if (route.path.startsWith('/timed/precision')) {
    title='Treino cronometrado — Precisão de clique';description='Alvos parados, móveis e grupos em uma sequência aleatória. Escolha o nível e treine por 60 segundos.';
  } else if (route.mode) {
    title = `Esquiva — ${route.mode==='normal'?'Normal':'Sobrevivência'} — Nível ${route.level}`;
    description = route.mode==='normal'?'Sobreviva por 60 segundos com três vidas.':'Uma vida. Tempo ilimitado. Sobreviva enquanto conseguir.';
  } else if (route.modality) {
    title = MODALITIES.find(({ id }) => id === route.modality).title;
    description = `Nível ${route.level} · Escolha seu treino abaixo.`;
  } else if (route.path.startsWith('/dodge-tech')) {
    title = `Treino técnico de Esquiva — Nível ${route.level??1}`; description = 'Sem pontuação ou vidas. Desvie dos projéteis com clique direito. Impactos são apenas diagnósticos em memória.';
  } else if (route.path === '/demo') {
    title = 'Sessão de demonstração'; description = 'Demonstração técnica — sem pontuação. ESC pausa ou retoma. Sair abandona sem criar histórico.';
  } else if (route.path === '/preview') {
    title = 'Prévia técnica 3D'; description = 'Arena e personagem originais. Prévia técnica interativa — sem pontuação.';
  } else if(route.path==='/practice/precision'){
    title='Prática técnica — Precisão de clique';description='Clique com o botão esquerdo nos alvos. O treino mistura alvos parados, móveis e grupos.';
  } else if(route.path==='/assessment/reflex'){
    title='Avaliação guiada — Reflexos e Reação';description='Sinais variados: habilidades, mouse e freio em três etapas de 20 segundos, nos níveis 3, 6 e 9.';
  } else if(route.path==='/assessment/kiting'){
    title='Avaliação guiada — Kiting';description='Três exercícios curtos, separados do histórico e da classificação oficial.';
  } else if(route.path==='/assessment/precision'){
    title='Avaliação guiada — Precisão de Clique';description='Três amostras de 20 segundos, separadas dos treinos oficiais.';
  } else if(route.path==='/assessment/dodge'){
    title='Avaliação guiada — Esquiva';description='Três amostras reais. Diagnóstico separado dos treinos oficiais.';
  } else if (route.path.endsWith('/reflex')) {
    title=({'/history/reflex':'Histórico de Reflexos','/records/reflex':'Recordes de Reflexos','/evolution/reflex':'Evolução de Reflexos','/achievements/reflex':'Conquistas de Reflexos'})[route.path]??title;description='Tentativas oficiais deste dispositivo, por exercício e dificuldade.';
  } else if (route.path.endsWith('/kiting')) {
    title=({'/history/kiting':'Histórico de Kiting','/records/kiting':'Recordes de Kiting','/evolution/kiting':'Evolução de Kiting','/achievements/kiting':'Conquistas de Kiting'})[route.path]??title;description='Dados oficiais salvos neste dispositivo, por exercício e nível.';
  } else if (route.path.endsWith('/precision')) {
    title=({'/history/precision':'Histórico de Precisão','/records/precision':'Recordes de Precisão','/evolution/precision':'Evolução de Precisão','/achievements/precision':'Conquistas de Precisão'})[route.path]??title;
    description='Dados salvos neste dispositivo. Cada variante e dificuldade possui seu próprio contexto.';
  } else if (route.path.endsWith('/dodge')) {
    title=({'/history/dodge':'Histórico de Esquiva','/records/dodge':'Recordes de Esquiva','/evolution/dodge':'Evolução de Esquiva','/achievements/dodge':'Conquistas de Esquiva'})[route.path]??title;
    description='Dados salvos neste dispositivo. Nenhuma comparação entre jogadores.';
  } else if (route.path === '/profile') {
    title = 'Sua evolução'; description = 'Quatro habilidades. Um jogador cada vez melhor.';
  } else if (route.path === '/settings') {
    title = 'Configurações'; description = 'Ajuste o movimento da câmera livre pelas bordas. As preferências são aplicadas na próxima abertura da prévia.';
  } else if (route.path === '/dpi') {
    title = 'Encontre seu DPI'; description = 'Meça o movimento. Compare o controle. Escolha com evidência.';
  }
  const heading = element(document, 'h1', '', title); heading.tabIndex = -1;
  main.append(heading, element(document, 'p', 'lead', description));
  if (['/levels', '/diagnostics'].includes(route.path)) {
    const grid = element(document, 'div', 'mode-grid');
    for (const mode of MODALITIES) {
      const card = element(document, 'section', 'mode-card');
      card.append(element(document, 'span', 'mode-icon', mode.icon), element(document, 'h2', '', mode.title), element(document, 'p', 'muted', mode.description));
      if (route.path === '/levels') {
        const levels = element(document, 'div', 'level-grid');
        for (let n = 1; n <= 10; n++) {
          const item = link(document, String(n), `/train/${mode.id}/${n}`, 'level');
          item.setAttribute('aria-label', `${mode.title}, nível ${n}`); levels.append(item);
        }
        card.append(levels);
      } else if(['dodge','precision','kiting','reflex'].includes(mode.id))card.append(link(document,'Iniciar avaliação',`/assessment/${mode.id}`,'button primary'));else card.append(element(document, 'p', 'status-note', 'Avaliação em preparação'));
      grid.append(card);
    }
    main.append(grid);
    if (route.path === '/levels') main.append(link(document, 'DPI e sensibilidade — ferramenta independente →', '/dpi', 'tool-card'));
  }
  if(route.modality==='reflex'&&!route.timed)main.append(link(document,'Abrir prática técnica de Reflexos','/practice/reflex','button'),link(document,'Treino cronometrado (60 s)',`/timed/reflex/${route.level}`,'button primary'));
  if(route.modality==='kiting'&&!route.timed)main.append(link(document,'Abrir prática técnica de Kiting','/practice/kiting','button'),link(document,'Treino cronometrado (60 s)',`/timed/kiting/${route.level}`,'button primary'));
  if(route.modality==='precision'&&!route.timed)main.append(link(document,'Abrir prática técnica de Precisão','/practice/precision','button'),link(document,'Treino cronometrado (60 s)',`/timed/precision/${route.level}`,'button primary'));
  if (route.modality === 'dodge' && !route.mode) {
    const modes = element(document, 'div', 'mode-grid');
    for (const [name, info] of [['Normal', '60 segundos · 3 vidas'], ['Sobrevivência', 'Tempo ilimitado · 1 vida']]) {
      const card = element(document, 'section', 'mode-card');
      card.append(element(document, 'h2', '', name), element(document, 'p', 'muted', info), link(document,'Iniciar →',`/play/dodge/${name==='Normal'?'normal':'survival'}/${route.level}`,'button primary'));
      modes.append(card);
    }
    main.append(modes,link(document,'Abrir treino técnico de Esquiva — sem pontuação',`/dodge-tech/${route.level}`,'button primary'));
  }
  if (['/preview','/demo'].includes(route.path)||route.path.startsWith('/dodge-tech')||route.mode) {
    const stage = element(document, 'div', 'stage'); stage.setAttribute('aria-label', 'Visualização da arena 3D');
    main.append(stage);
  }
  return main;
}

import { MAX_DODGE_LEVEL } from '../training/dodge/constants.js';
import { GAME_VERSION } from '../app/version.js';
import { MODALITIES } from './routes.js';
import { element, link } from './elements.js';
import { createFoundationView } from './createFoundationView.js';

export function createScreen(document, route, {dodgePlacement=null}={}) {
  if (route.path === '/') {
    const home = createFoundationView(document);
    home.classList.add('home');
    const panel = home.querySelector('section');
    panel.replaceChildren(element(document,'span','eyebrow','RIFT LAB / PRÁTICA DELIBERADA'),element(document,'h1','','Mecânica afiada.\nJogo diferente.'),element(document,'p','foundation__message','Leia a ameaça. Escolha o movimento. Execute com intenção. Um laboratório de mecânica para treinar uma habilidade de cada vez.'));
    const actions=element(document,'div','actions');actions.append(link(document,'Começar pela esquiva →','/assessment/dodge','button primary'),link(document,'Escolher outro treino','/levels','button'));panel.append(actions);
    panel.append(element(document,'p','briefing-note','Teclado e mouse · Sem conta · Progresso neste dispositivo'));
    const art=element(document,'div','hero-art lab-map');art.setAttribute('aria-hidden','true');
    art.append(element(document,'span','hero-art__label','01 / LEITURA DE ARENA'),element(document,'div','lab-map__lane'),element(document,'div','lab-map__threat'),element(document,'div','lab-map__player'),element(document,'span','hero-art__caption','OBSERVAR → DECIDIR → EXECUTAR'));home.append(art);
    const journey=element(document,'section','training-journey');journey.setAttribute('aria-labelledby','journey-title');
    journey.append(element(document,'span','eyebrow','SEU PRIMEIRO TREINO'),element(document,'h2','','Uma habilidade. Um foco. Uma nova tentativa.'));journey.querySelector('h2').id='journey-title';
    const steps=element(document,'ol','journey-steps');
    for(const [number,title,copy,path,action]of [
      ['01','Encontre seu ponto de partida','A avaliação de esquiva ajusta o desafio em cinco etapas de até 30 segundos.','/assessment/dodge','Fazer avaliação'],
      ['02','Pratique com intenção','No Normal, treine no nível indicado. Na Sobrevivência, escolha livremente seu desafio.','/train/dodge','Abrir esquiva'],
      ['03','Reveja e repita','Ao terminar a esquiva, reveja até os últimos seis segundos disponíveis. No Perfil, consulte as evidências dos treinos salvos.','/profile','Ver meu Perfil']
    ]){const step=element(document,'li');step.append(element(document,'span','journey-number',number),element(document,'h3','',title),element(document,'p','muted',copy),link(document,action,path,'journey-link'));steps.append(step);}journey.append(steps);home.append(journey);
    const grid=element(document,'div','home-modes');
    for(const [index,mode]of MODALITIES.entries()){
      const card=link(document,'',`/train/${mode.id}/1`,'home-mode');card.dataset.mode=mode.id;card.append(element(document,'span','eyebrow',`0${index+1} / ${mode.icon}`),element(document,'h2','',mode.title),element(document,'p','muted',mode.description),element(document,'span','mode-duration',mode.id==='dodge'?'AVALIAÇÃO + ARENA SEM TEMPO LIMITE':'PRÁTICA LIVRE + DESAFIO DE 60 S'),element(document,'span','home-mode__action','Explorar treino →'));grid.append(card);
    }
    panel.querySelector('h1').id='foundation-title';
    home.append(grid,element(document,'p','home-footer',`RIFT LAB · ${GAME_VERSION} · Seu progresso fica neste dispositivo.`));
    return home;
  }
  const main = element(document, 'main', 'screen');
  main.tabIndex = -1;
  main.append(link(document, '← Voltar ao início', '/'));
  let title = 'Página não encontrada';
  let description = 'Esse endereço não corresponde a uma tela do MOBA Training.';
  if (route.path === '/levels') {
    title = 'Todos os níveis'; description = 'Escolha uma habilidade. Na esquiva, o Normal segue sua avaliação; a Sobrevivência permite seleção livre.';
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
    description = route.mode==='normal'?'Três vidas, sem limite de tempo. Encerre para analisar ou sobreviva enquanto conseguir.':'Uma vida. Tempo ilimitado. Sobreviva enquanto conseguir.';
  } else if (route.modality) {
    title = MODALITIES.find(({ id }) => id === route.modality).title;
    description = route.modality==='dodge'?`${MAX_DODGE_LEVEL} níveis. Descubra seu ponto de partida ou escolha um desafio de Sobrevivência.`:`Nível ${route.level} · Escolha seu treino abaixo.`;
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
    title='Avaliação guiada — Esquiva';description='Cinco etapas adaptativas. Sua dificuldade é ajustada pelo desempenho observado.';
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
      if (route.path === '/levels'&&mode.id==='dodge'){card.append(element(document,'p','muted',`${MAX_DODGE_LEVEL} níveis · Normal por avaliação · Sobrevivência com escolha livre`),link(document,'Abrir esquiva →','/train/dodge','button primary'));}
      else if (route.path === '/levels') {
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
    const modes=element(document,'div','mode-grid'),normal=element(document,'section','mode-card'),survival=element(document,'section','mode-card');
    normal.append(element(document,'span','eyebrow','SEU PERCURSO'),element(document,'h2','','Normal'),element(document,'p','muted',dodgePlacement?`Nível atual: ${dodgePlacement.level}/${MAX_DODGE_LEVEL} · 3 vidas · tempo ilimitado`:'Faça a avaliação para começar no nível indicado para você.'),link(document,dodgePlacement?`Continuar no nível ${dodgePlacement.level} →`:'Descobrir minha habilidade →',dodgePlacement?'/play/dodge/normal':'/assessment/dodge','button primary'));
    if(dodgePlacement){
      normal.append(link(document,'Refazer avaliação','/assessment/dodge'));const details=element(document,'details','placement-evidence');details.append(element(document,'summary','','Ver minha avaliação'),element(document,'p','muted','Estas etapas definiram seu ponto de partida. O nível atual também acompanha sua evolução nos treinos.'));
      const list=element(document,'ol');for(const result of dodgePlacement.results)list.append(element(document,'li','',`Nível ${result.level} · ${result.activeSeconds.toFixed(1)} s · ${result.verifiedDodges} esquivas · ${result.hits} impactos`));details.append(list);normal.append(details);
    }
    survival.append(element(document,'span','eyebrow','ESCOLHA SEU DESAFIO'),element(document,'h2','','Sobrevivência'),element(document,'p','muted','Uma vida, tempo ilimitado. Escolha qualquer nível para jogar.' ));
    const label=element(document,'label','','Nível '),select=element(document,'select');select.setAttribute('aria-label','Nível da Sobrevivência');
    for(let n=1;n<=MAX_DODGE_LEVEL;n++){const option=element(document,'option','',`${n} · ${n<=5?'Fundamentos':n<=10?'Intermediário':n<=15?'Avançado':'Elite'}`);option.value=String(n);select.append(option);}select.value=String(route.level??1);label.append(select);
    const play=link(document,'Jogar Sobrevivência →',`/play/dodge/survival/${select.value}`,'button primary');select.addEventListener('change',()=>{play.href=`#/play/dodge/survival/${select.value}`;});survival.append(label,play);modes.append(normal,survival);main.append(modes);
  }
  if (['/preview','/demo'].includes(route.path)||route.mode) {
    const stage = element(document, 'div', 'stage'); stage.setAttribute('aria-label', 'Visualização da arena 3D');
    main.append(stage);
  }
  return main;
}

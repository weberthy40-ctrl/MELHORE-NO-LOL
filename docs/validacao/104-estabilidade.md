# 104 — Preferências, recursos e desempenho

PASSOU: Leve/Médio/Alto aplicam teto real de pixel ratio 1/1,4/1,75, com antialias e efeitos opcionais, sem alterar CSS, câmera, hitboxes ou relógio. Resize/DPR reaplicam o preset. Contraste, texto e reduced motion são preferências visuais; áudio tem um contexto lazy, master gain, limite de quatro vozes e liberação por gesto.

Feedback somente após eventos confirmados, sem som antecipando estímulos de Reflexos ou ataques de Esquiva. VFX usa quatro anéis reutilizáveis, sem RAF próprio ou colisão. Pausa congela animação e efeitos; teardown remove listeners e recursos exclusivos. Falha de áudio degrada silenciosamente; WebGL indisponível tem erro acessível e saída funcional.

Chromium real: dez entradas/saídas, um RAF ativo na cena, zero RAF/canvas no menu. Após GC, heap observado foi de aproximadamente 8,75 MB no segundo ciclo a 9,45 MB no décimo, abaixo do limite de regressão de 5 MiB após aquecimento. Isso é uma amostra curta, não prova de ausência de vazamento de longo prazo. Não foi medido FPS nem memória de GPU.

Inspeção de screenshots: menus sem overflow em 1366×768, 1920×1080 e 390×844. Roteiro humano de áudio, contraste, desempenho sustentado e hardware Windows permanece NÃO VERIFICADO. O chunk Three.js >500 kB é um aviso conhecido de distribuição sob demanda, não falha de build.

No build extraído de produção, DPR 2: canvas CSS 1168,75 px, buffer interno 1169 px (Leve), 1636 px (Médio), 2045 px (Alto). Preferências foram restauradas ao final. O smoke de produção repetiu os dez ciclos sem RAF/canvas fora da cena.

# 101 — Espaço, tempo, câmera e colisão

PASSOU: mundo X/Z, Y vertical, corredor 18×38, origem central, limites inclusivos; movimento 7 u/s e parada sem overshoot; câmera Y, zoom e pan de bordas; clique calculado em pixels CSS. Esferas, alcances e projéteis usam unidades de mundo.

Colisão swept relativa cobre tangência, tunneling, overlap e TTL parcial. Cabo do gancho é apenas visual. Áreas são ativas ao nascer, sem telegraph; spawn evita sobreposição inicial e margem de reação. Normal termina em 60 s/3 vidas; Sobrevivência tem 1 vida e não ganha por tempo. Impacto fatal no último passo tem precedência sobre vitória, com resolução por passo de até 0,1 s.

Regressão independente: percorre todos os dez níveis por 120 s de simulação, confirma os quatro tipos realmente admitidos, limite de concorrência e uma rota testemunha amostrada a cada 5 ms por 1,2 s, com velocidade real e bordas. A admissão usa margem própria e sondas finitas; isso não prova ausência universal de situações difíceis nem substitui playtest.

Animações de membros usam proxies de raycast na pose neutra; testes confirmam distâncias de interseção idênticas com animação ativa/inativa. VFX não recebem raycast nem emitem dano. GPU física, dificuldade humana e legibilidade em todos os monitores continuam pendentes.

Calculadora Estrutural Interativa — Vigas Isostáticas
📌 Visão Geral

Este projeto consiste em uma ferramenta web interativa para análise estrutural, inicialmente focada em vigas isostáticas, com planos de expansão para pórticos, treliças, grelhas e arcos.

A aplicação permite que o usuário desenhe a estrutura diretamente na tela, insira apoios e cargas, e obtenha as reações de apoio com base nos princípios clássicos da Estática e Resistência dos Materiais.

O projeto é desenvolvido como um GitHub Pages, sem dependências externas pesadas, visando simplicidade, acessibilidade e foco educacional.

🎓 Motivação

Nos cursos de Engenharia Civil, especialmente nas disciplinas de:

Mecânica Geral

Estática

Resistência dos Materiais

Análise Estrutural

é comum que o conteúdo seja altamente teórico, enquanto o material de apoio prático e interativo disponível gratuitamente seja limitado.

Esta ferramenta nasce com o objetivo de:

Auxiliar estudantes no entendimento visual e conceitual do comportamento estrutural

Reduzir a abstração excessiva comum nas disciplinas iniciais

Servir como um ambiente de experimentação, onde o aluno pode:

testar diferentes configurações

errar

observar resultados

consolidar conceitos fundamentais

O projeto é também um exercício pessoal de aprendizado e aprofundamento em engenharia estrutural e desenvolvimento web, com a expectativa de contribuir com a comunidade acadêmica.

🧠 Conceitos Abordados

Na versão atual, a ferramenta trabalha com:

Vigas retas no plano (2D)

Estruturas isostáticas

Equilíbrio estático:

ΣFy = 0

ΣM = 0

Cargas concentradas verticais

Apoios:

pino

rolete

engaste (caso de balanço)

✏️ Funcionalidades Atuais

Desenho livre da viga no canvas

Definição do comprimento real da viga

Inserção gráfica de:

apoios

cargas concentradas

Conversão automática de coordenadas gráficas para valores reais

Cálculo das reações de apoio

Visualização das reações no canvas

Estrutura de código preparada para expansão

🚧 Funcionalidades Planejadas

Diagramas de:

esforço cortante

momento fletor

Cargas distribuídas

Momentos aplicados

Refatoração do solver para método matricial

Análise de:

pórticos

treliças

grelhas

arcos

Interface mais avançada para edição de propriedades

Exportação de resultados

🛠️ Tecnologias Utilizadas

HTML5

CSS3

JavaScript (Vanilla)

Canvas API

GitHub Pages

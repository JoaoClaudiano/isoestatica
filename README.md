# Análise Estrutural Interativa — Vigas Isostáticas

## 1. Apresentação

Este projeto consiste no desenvolvimento de uma **ferramenta web interativa para Análise Estrutural**, com foco inicial em **vigas isostáticas**, voltada ao **apoio didático no ensino de Engenharia**.

A aplicação permite ao usuário **modelar graficamente estruturas**, definir **vínculos e carregamentos**, e obter as **reações de apoio** a partir das equações clássicas de equilíbrio estático. O sistema foi concebido para funcionar diretamente no navegador, sem dependência de softwares proprietários, priorizando acessibilidade e clareza conceitual.

---

## 2. Justificativa e Motivação

Nos cursos de **Engenharia Civil** e áreas afins, disciplinas como:

- Estática
- Análise Estrutural
- Mecânica Geral
- Resistência dos Materiais

apresentam, em geral, uma abordagem **predominantemente teórica**, com forte carga matemática e limitada disponibilidade de ferramentas interativas gratuitas que auxiliem na visualização e consolidação dos conceitos fundamentais.

Diante desse contexto, esta ferramenta foi desenvolvida com o propósito de:

- Auxiliar estudantes na **compreensão dos princípios da Análise Estrutural**
- Reduzir o nível de abstração associado ao estudo de estruturas
- Permitir a **experimentação prática** de diferentes configurações estruturais
- Atuar como material complementar às aulas teóricas

O projeto também reflete um esforço pessoal de aprofundamento técnico e acadêmico, com o objetivo de contribuir para a comunidade estudantil, assim como o próprio autor foi impactado pela escassez de recursos didáticos interativos durante sua formação.

---

## 3. Objetivos

### 3.1 Objetivo Geral

Desenvolver uma ferramenta educacional interativa que auxilie no ensino e aprendizado de **Análise Estrutural**, permitindo a modelagem e análise de estruturas isostáticas de forma intuitiva e visual.

### 3.2 Objetivos Específicos

- Permitir o desenho livre de vigas no plano
- Possibilitar a definição de apoios e carregamentos
- Aplicar corretamente as equações de equilíbrio estático
- Determinar reações de apoio em estruturas isostáticas
- Preparar a base computacional para expansão futura do sistema

---

## 4. Conceitos Teóricos Abordados

A ferramenta aborda conceitos fundamentais de **Análise Estrutural**, incluindo:

- Sistemas estruturais planos
- Estruturas isostáticas
- Vínculos e graus de liberdade
- Equilíbrio estático:
  - ΣFy = 0
  - ΣM = 0
- Cargas concentradas verticais
- Reações de apoio
- Conversão entre sistema gráfico e sistema real

---

## 5. Funcionalidades Atuais

Na versão atual, a aplicação permite:

- Desenho livre da viga diretamente no canvas
- Definição do comprimento real da estrutura
- Inserção gráfica de:
  - apoios do tipo pino, rolete e engaste
  - cargas concentradas verticais
- Conversão automática de coordenadas gráficas para valores reais
- Cálculo das reações de apoio
- Visualização gráfica das reações no próprio modelo estrutural

---

## 6. Limitações Atuais

O sistema, em sua versão atual, apresenta as seguintes limitações:

- Análise restrita a vigas isostáticas
- Apenas cargas concentradas são consideradas
- Não há geração de diagramas de esforços internos
- Não trata estruturas hiperestáticas
- Não realiza verificação de tensões ou deformações

Essas limitações são **intencionais**, visando manter o foco didático e a clareza conceitual nas etapas iniciais do projeto.

---

## 7. Funcionalidades Planejadas

Estão previstas para versões futuras:

- Diagramas de esforço cortante e momento fletor
- Cargas distribuídas e momentos aplicados
- Análise por método matricial
- Extensão para:
  - pórticos planos
  - treliças
  - grelhas
  - arcos
- Interface avançada para edição de propriedades
- Exportação de resultados

---

## 8. Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Canvas API
- GitHub Pages

A escolha por tecnologias nativas visa facilitar o entendimento do código e sua utilização como material de estudo.

---

## 9. Estrutura do Projeto
    /
    ├── index.html
    ├── style.css
    ├── js/
    │ └── app.js
    ├── img/
    ├── dialog-polyfill.js
    ├── dialog-polyfill.css
    ├── favicon.ico
    └── README.md

---

## 10. Considerações Finais

Esta ferramenta possui **finalidade estritamente educacional**.  
Os resultados obtidos não substituem softwares profissionais de cálculo estrutural e não devem ser utilizados para fins de projeto executivo.

---

## 11. Contribuições

Sugestões, correções conceituais e melhorias são bem-vindas, especialmente aquelas que contribuam para a **qualidade didática e rigor técnico** da ferramenta.

---

## 12. Licença

Projeto distribuído sob licença livre para fins educacionais e acadêmicos.


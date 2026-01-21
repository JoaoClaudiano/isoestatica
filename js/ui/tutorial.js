// Sistema de tutorial interativo
class TutorialSystem {
    constructor(app) {
        this.app = app;
        this.currentStep = 0;
        this.isActive = false;
        this.tutorials = {
            beam: this.createBeamTutorial(),
            frame: this.createFrameTutorial(),
            grid: this.createGridTutorial(),
            arch: this.createArchTutorial()
        };
        this.init();
    }

    init() {
        this.setupTutorialModal();
        this.checkFirstVisit();
    }

    setupTutorialModal() {
        const modal = document.getElementById('tutorial-modal');
        const content = document.getElementById('tutorial-content');
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        const skipBtn = document.getElementById('tutorial-skip');
        const closeBtn = modal.querySelector('.modal-close');

        // Event listeners
        prevBtn.addEventListener('click', () => this.previousStep());
        nextBtn.addEventListener('click', () => this.nextStep());
        skipBtn.addEventListener('click', () => this.skipTutorial());
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('isostatica_visited');
        if (!hasVisited) {
            this.startTutorial('beam'); // Tutorial padrão para vigas
            localStorage.setItem('isostatica_visited', 'true');
        }
    }

    createBeamTutorial() {
        return [
            {
                title: 'Bem-vindo à análise de vigas!',
                content: 'Vigas são elementos estruturais lineares sujeitos principalmente a cargas transversais. Vamos aprender a analisar uma viga isostática.',
                image: '📏'
            },
            {
                title: 'Passo 1: Adicionar nós',
                content: 'Clique na área de desenho para adicionar nós. Para uma viga simples, adicione dois nós com alguma distância entre eles.',
                action: 'suggestAddNodes',
                hint: 'Tente adicionar nós nas posições (0,0) e (6,0)'
            },
            {
                title: 'Passo 2: Conectar nós com uma barra',
                content: 'Selecione a ferramenta "Barra" e clique nos nós para conectá-los com uma barra.',
                action: 'suggestAddBeam',
                hint: 'Conecte os dois nós que você criou'
            },
            {
                title: 'Passo 3: Adicionar apoios',
                content: 'Apoios são vínculos que impedem movimentos da estrutura. Para uma viga biapoiada, adicione um apoio fixo em um nó e um apoio móvel no outro.',
                action: 'suggestAddSupports',
                hint: 'Adicione um apoio fixo no nó esquerdo e um móvel no direito'
            },
            {
                title: 'Passo 4: Aplicar cargas',
                content: 'Cargas são forças que atuam na estrutura. Adicione uma carga pontual ou distribuída para analisar.',
                action: 'suggestAddLoad',
                hint: 'Adicione uma carga pontual de 10 kN para baixo no meio da viga'
            },
            {
                title: 'Passo 5: Calcular e visualizar',
                content: 'Clique em "Calcular" para analisar a estrutura. Use os controles de diagrama para visualizar esforços internos.',
                action: 'suggestCalculate',
                hint: 'Clique no botão Calcular e ative os diagramas V e M'
            }
        ];
    }

    createFrameTutorial() {
        return [
            {
                title: 'Análise de pórticos planos',
                content: 'Pórticos são estruturas formadas por barras ligadas por nós rígidos. Vamos analisar um pórtico simples.',
                image: '🏗️'
            },
            {
                title: 'Passo 1: Criar a geometria',
                content: 'Adicione nós nos vértices do pórtico. Um pórtico simples tem formato de "portal".',
                hint: 'Crie nós em (0,0), (0,3), (4,3), (4,0)'
            },
            {
                title: 'Passo 2: Conectar com barras',
                content: 'Conecte os nós para formar as colunas e a viga do pórtico.',
                hint: 'Conecte os nós na ordem: (0,0)-(0,3)-(4,3)-(4,0)'
            },
            {
                title: 'Passo 3: Adicionar vínculos',
                content: 'Para pórticos, geralmente usamos engastes ou apoios fixos nas bases.',
                hint: 'Adicione engastes nos nós (0,0) e (4,0)'
            },
            {
                title: 'Passo 4: Aplicar cargas',
                content: 'Pórticos podem receber cargas verticais e horizontais.',
                hint: 'Adicione uma carga horizontal na viga superior'
            }
        ];
    }

    createGridTutorial() {
        return [
            {
                title: 'Análise de grelhas',
                content: 'Grelhas são estruturas espaciais sujeitas a cargas perpendiculares ao seu plano.',
                image: '🔲'
            },
            {
                title: 'Características especiais',
                content: 'Grelhas consideram momentos torçores além dos esforços normais de flexão.',
                hint: 'Ative o diagrama de torção para visualizar esse esforço'
            }
        ];
    }

    createArchTutorial() {
        return [
            {
                title: 'Análise de arcos',
                content: 'Arcos são estruturas curvas que trabalham principalmente à compressão.',
                image: '🌉'
            },
            {
                title: 'Linha de pressão',
                content: 'Arcos ideais têm sua linha de pressão coincidente com o eixo geométrico, minimizando momentos.',
                hint: 'Observe como o diagrama de momentos é menor em arcos bem dimensionados'
            }
        ];
    }

    startTutorial(structureType) {
        this.currentTutorial = this.tutorials[structureType];
        this.currentStep = 0;
        this.isActive = true;
        this.showCurrentStep();
        document.getElementById('tutorial-modal').classList.remove('hidden');
    }

    showCurrentStep() {
        if (!this.currentTutorial || !this.currentTutorial[this.currentStep]) return;

        const step = this.currentTutorial[this.currentStep];
        const content = document.getElementById('tutorial-content');
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        const skipBtn = document.getElementById('tutorial-skip');

        // Atualizar conteúdo
        let html = `
            <div class="tutorial-step">
                <h4>${step.title}</h4>
                <p>${step.content}</p>
        `;

        if (step.image) {
            html += `<div class="tutorial-image">${step.image}</div>`;
        }

        if (step.hint) {
            html += `<div class="tutorial-hint">
                <i class="fas fa-lightbulb"></i>
                <strong>Dica:</strong> ${step.hint}
            </div>`;
        }

        html += `</div>`;

        content.innerHTML = html;

        // Atualizar botões
        prevBtn.disabled = this.currentStep === 0;
        nextBtn.textContent = this.currentStep === this.currentTutorial.length - 1 ? 'Concluir' : 'Próximo';

        // Executar ação se houver
        if (step.action) {
            this.executeAction(step.action);
        }
    }

    executeAction(action) {
        switch(action) {
            case 'suggestAddNodes':
                this.app.updateStatusMessage('Clique na área de desenho para adicionar nós');
                break;
            case 'suggestAddBeam':
                this.app.ui.setTool('beam');
                this.app.updateStatusMessage('Selecione dois nós para conectá-los com uma barra');
                break;
            case 'suggestAddSupports':
                this.app.updateStatusMessage('Selecione um tipo de apoio e clique em um nó');
                break;
            case 'suggestAddLoad':
                this.app.updateStatusMessage('Selecione um tipo de carga e clique na estrutura');
                break;
            case 'suggestCalculate':
                this.app.updateStatusMessage('Clique no botão Calcular para analisar a estrutura');
                break;
        }
    }

    nextStep() {
        if (this.currentStep < this.currentTutorial.length - 1) {
            this.currentStep++;
            this.showCurrentStep();
        } else {
            this.completeTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showCurrentStep();
        }
    }

    skipTutorial() {
        this.isActive = false;
        document.getElementById('tutorial-modal').classList.add('hidden');
        this.app.updateStatusMessage('Tutorial pulado. Use o menu Ajuda se precisar.');
    }

    completeTutorial() {
        this.isActive = false;
        document.getElementById('tutorial-modal').classList.add('hidden');
        this.app.updateStatusMessage('Tutorial concluído! Agora você pode explorar a ferramenta.');
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'completion-message';
        message.innerHTML = `
            <div class="completion-content">
                <i class="fas fa-graduation-cap"></i>
                <h4>Tutorial Concluído!</h4>
                <p>Você aprendeu os fundamentos da análise estrutural.</p>
                <p>Continue explorando para dominar todos os conceitos!</p>
                <button class="btn-primary close-completion">Continuar</button>
            </div>
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.classList.add('show');
        }, 100);

        message.querySelector('.close-completion').addEventListener('click', () => {
            message.classList.remove('show');
            setTimeout(() => {
                message.remove();
            }, 300);
        });
    }

    // Mostrar dica contextual
    showContextHint(message, duration = 5000) {
        const hint = document.createElement('div');
        hint.className = 'context-hint';
        hint.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(hint);

        setTimeout(() => {
            hint.classList.add('show');
        }, 100);

        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => {
                hint.remove();
            }, 300);
        }, duration);
    }

    // Verificar progresso do usuário
    checkUserProgress() {
        const progress = {
            nodesAdded: this.app.currentStructure?.nodes.length > 0,
            beamsAdded: this.app.currentStructure?.beams.length > 0,
            supportsAdded: this.app.currentStructure?.nodes.some(n => n.support),
            loadsAdded: this.app.currentStructure?.nodes.some(n => n.loads.length > 0) ||
                        this.app.currentStructure?.beams.some(b => b.distributedLoads.length > 0),
            calculated: this.app.isCalculated
        };

        return progress;
    }

    // Oferecer ajuda baseada no progresso
    offerHelp() {
        const progress = this.checkUserProgress();
        
        if (!progress.nodesAdded) {
            this.showContextHint('Comece adicionando alguns nós à estrutura.');
        } else if (!progress.beamsAdded) {
            this.showContextHint('Conecte os nós com barras usando a ferramenta Barra.');
        } else if (!progress.supportsAdded) {
            this.showContextHint('Adicione apoios para restringir a estrutura.');
        } else if (!progress.loadsAdded) {
            this.showContextHint('Aplique cargas para analisar a resposta da estrutura.');
        } else if (!progress.calculated) {
            this.showContextHint('Clique em Calcular para ver os resultados.');
        }
    }
}

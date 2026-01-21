// Isostática Lab - Aplicação Principal
// Versão corrigida - Removida inicialização duplicada

class IsostaticaApp {
    constructor() {
        console.log('Construtor IsostaticaApp chamado...');
        
        this.currentStructure = null;
        this.structureType = 'beam';
        this.isCalculated = false;
        this.renderer = null;
        this.canvas = null;
        this.ctx = null;
        
        // Inicialização após garantir DOM e canvas
        this.initApp();
    }
    
    initApp() {
        console.log('Inicializando Isostática Lab...');
        
        // 1. PRIMEIRO: Encontrar e configurar o canvas
        this.canvas = document.getElementById('structure-canvas');
        
        if (!this.canvas) {
            console.error('❌ Canvas não encontrado! Verificando elementos...');
            console.log('Elementos com ID:', document.querySelectorAll('[id]'));
            return;
        }
        
        console.log('✅ Canvas encontrado:', this.canvas);
        console.log('Dimensões:', this.canvas.clientWidth, 'x', this.canvas.clientHeight);
        
        // Verificar se o canvas está visível
        const style = window.getComputedStyle(this.canvas);
        if (style.display === 'none') {
            console.warn('⚠️ Canvas está com display:none');
        }
        
        // Inicializar contexto
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('❌ Não foi possível obter contexto 2D');
            return;
        }
        
        console.log('✅ Contexto 2D inicializado com sucesso!');
        
        // 2. SEGUNDO: Inicializar renderizador (passando contexto)
        this.renderer = new StructureRenderer(this.canvas, this.ctx);
        
        // 3. TERCEIRO: Inicializar interface
        this.ui = new UIControls(this);
        
        // 4. QUARTO: Configurar eventos
        this.setupBasicEventListeners();
        
        // 5. QUINTO: Carregar módulo padrão
        this.loadStructureModule('beam');
        
        console.log('✅ Isostática Lab totalmente inicializado!');
    }
    
    setupBasicEventListeners() {
        console.log('Configurando listeners de evento...');
        
        // Botão de voltar ao menu
        const backBtn = document.getElementById('back-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showWelcomeScreen());
        }
        
        // Cards de seleção de estrutura
        document.querySelectorAll('.structure-card').forEach(card => {
            const btn = card.querySelector('.btn-select');
            if (btn) {
                btn.addEventListener('click', () => {
                    const type = card.getAttribute('data-type');
                    this.loadStructureModule(type);
                    this.hideWelcomeScreen();
                });
            }
        });
        
        // Exemplos
        const exampleSelect = document.getElementById('example-select');
        if (exampleSelect) {
            exampleSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadExample(e.target.value);
                    this.hideWelcomeScreen();
                }
            });
        }
        
        // Pular tutorial
        const skipBtn = document.getElementById('skip-tutorial');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.hideWelcomeScreen());
        }
        
        // Abas
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
        
        // Botão Calcular
        const calculateBtn = document.getElementById('btn-calculate');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateStructure());
        }
        
        // Botão Reiniciar
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetStructure());
        }
    }
    
    showWelcomeScreen() {
        const welcome = document.getElementById('welcome-screen');
        const main = document.getElementById('main-interface');
        if (welcome) welcome.classList.remove('hidden');
        if (main) main.style.display = 'none';
    }
    
    hideWelcomeScreen() {
        const welcome = document.getElementById('welcome-screen');
        const main = document.getElementById('main-interface');
        if (welcome) welcome.classList.add('hidden');
        if (main) main.style.display = 'flex';
    }
    
    loadStructureModule(type) {
        console.log(`Carregando módulo: ${type}`);
        this.structureType = type;
        
        // Atualizar título
        const title = document.getElementById('structure-title');
        if (title) {
            title.textContent = type === 'beam' ? 'Viga Isostática' :
                               type === 'frame' ? 'Pórtico Plano' :
                               type === 'grid' ? 'Grelha Isostática' : 'Arco Isostático';
        }
        
        // Atualizar indicador
        const indicator = document.getElementById('structure-type-indicator');
        if (indicator) {
            indicator.textContent = type === 'beam' ? 'VIGA' :
                                   type === 'frame' ? 'PÓRTICO' :
                                   type === 'grid' ? 'GRELHA' : 'ARCO';
        }
        
        // Criar nova estrutura
        switch(type) {
            case 'beam':
                if (typeof BeamStructure !== 'undefined') {
                    this.currentStructure = new BeamStructure();
                } else {
                    console.error('BeamStructure não definido!');
                }
                break;
            case 'frame':
                if (typeof FrameStructure !== 'undefined') {
                    this.currentStructure = new FrameStructure();
                }
                break;
            case 'grid':
                if (typeof GridStructure !== 'undefined') {
                    this.currentStructure = new GridStructure();
                }
                break;
            case 'arch':
                if (typeof ArchStructure !== 'undefined') {
                    this.currentStructure = new ArchStructure();
                }
                break;
        }
        
        // Atualizar renderizador
        if (this.renderer && this.currentStructure) {
            this.renderer.setStructure(this.currentStructure);
            this.renderer.render();
        }
        
        // Atualizar informações
        this.updateStructureInfo();
        
        // Log para depuração
        console.log('Módulo carregado:', type, 'Estrutura:', this.currentStructure);
    }
    
    loadExample(exampleId) {
        console.log(`Carregando exemplo: ${exampleId}`);
        // Implementação básica de exemplos
        switch(exampleId) {
            case 'beam-simple':
                this.loadStructureModule('beam');
                // Adicionar estrutura de exemplo
                if (this.currentStructure) {
                    const node1 = this.currentStructure.addNode(0, 0);
                    const node2 = this.currentStructure.addNode(6, 0);
                    this.currentStructure.addBeam(node1, node2);
                    this.currentStructure.addSupport(node1, 'pinned');
                    this.currentStructure.addSupport(node2, 'roller');
                    this.currentStructure.addPointLoad(node2, 10, 270);
                    
                    if (this.renderer) {
                        this.renderer.render();
                        this.updateStructureInfo();
                    }
                }
                break;
        }
    }
    
    updateStructureInfo() {
        if (!this.currentStructure) return;
        
        const barCount = document.getElementById('bar-count');
        const nodeCount = document.getElementById('node-count');
        const staticDegree = document.getElementById('static-degree');
        
        if (barCount) barCount.textContent = this.currentStructure.beams?.length || 0;
        if (nodeCount) nodeCount.textContent = this.currentStructure.nodes?.length || 0;
        if (staticDegree) staticDegree.textContent = '0'; // Simplificado
    }
    
    updateStatusMessage(message) {
        const status = document.getElementById('status-message');
        if (status) status.textContent = message;
    }
    
    calculateStructure() {
        this.updateStatusMessage('Cálculo realizado (simulação)');
        this.isCalculated = true;
        
        // Atualizar status
        const calcStatus = document.getElementById('calc-status');
        if (calcStatus) {
            calcStatus.innerHTML = '<i class="fas fa-check-circle"></i> Calculado';
            calcStatus.style.color = 'var(--success-color)';
        }
        
        // Mostrar mensagem
        if (this.ui) {
            this.ui.showToast('Cálculo simulado realizado com sucesso!', 'success');
        }
    }
    
    resetStructure() {
        if (confirm('Reiniciar estrutura?')) {
            this.loadStructureModule(this.structureType);
            this.updateStatusMessage('Estrutura reiniciada');
        }
    }
    
    switchTab(tabId) {
        // Esconder todas as abas
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        const tabContent = document.getElementById(`tab-${tabId}`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Atualizar botões das abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }
}

// Inicialização ÚNICA quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando Isostática Lab...');
    
    // Aguardar um pouco para garantir que todos os scripts estão carregados
    setTimeout(() => {
        window.app = new IsostaticaApp();
    }, 100);
});

// Para acesso global
if (typeof window !== 'undefined') {
    window.IsostaticaApp = IsostaticaApp;
}

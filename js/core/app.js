// Isostática Lab - Aplicação Principal Simplificada
// NO TOPO DO app.js - Substitua a inicialização atual
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando canvas...');
    
    // Aguardar um pouco para garantir que tudo está pronto
    setTimeout(initApp, 100);
});

function initApp() {
    const canvas = document.getElementById('structure-canvas');
    
    if (!canvas) {
        console.error('❌ Canvas não encontrado! Verificando elementos...');
        console.log('Elementos com ID:', document.querySelectorAll('[id]'));
        return;
    }
    
    console.log('✅ Canvas encontrado:', canvas);
    console.log('Dimensões:', canvas.clientWidth, 'x', canvas.clientHeight);
    
    // Verificar se o canvas está visível
    const style = window.getComputedStyle(canvas);
    if (style.display === 'none') {
        console.warn('⚠️ Canvas está com display:none');
    }
    
    // Inicializar contexto
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('❌ Não foi possível obter contexto 2D');
        return;
    }
    
    console.log('✅ Contexto 2D inicializado com sucesso!');
    
    // Restante da sua inicialização...
    // Inicializar controles, módulos, etc.
}

class IsostaticaApp {
    constructor() {
        this.currentStructure = null;
        this.structureType = 'beam';
        this.isCalculated = false;
        this.renderer = null;
        
        // Inicialização tardia para garantir DOM
        setTimeout(() => this.init(), 100);
    }
    
    init() {
        console.log('Inicializando Isostática Lab...');
        
        // Inicializar renderizador
        this.renderer = new StructureRenderer('structure-canvas');
        
        // Inicializar interface
        this.ui = new UIControls(this);
        
        // Configurar eventos básicos
        this.setupBasicEventListeners();
        
        // Carregar módulo padrão
        this.loadStructureModule('beam');
    }
    
    setupBasicEventListeners() {
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
        
        // Criar nova estrutura
        switch(type) {
            case 'beam':
                this.currentStructure = new BeamStructure();
                break;
            case 'frame':
                this.currentStructure = new FrameStructure();
                break;
            case 'grid':
                this.currentStructure = new GridStructure();
                break;
            case 'arch':
                this.currentStructure = new ArchStructure();
                break;
        }
        
        // Atualizar renderizador
        if (this.renderer) {
            this.renderer.setStructure(this.currentStructure);
            this.renderer.render();
        }
        
        // Atualizar informações
        this.updateStructureInfo();
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

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new IsostaticaApp();
    });
} else {
    window.app = new IsostaticaApp();
}

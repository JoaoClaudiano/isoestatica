// Isostática Lab - Aplicação Principal CORRIGIDA
class IsostaticaApp {
    constructor() {
        console.log('Construtor IsostaticaApp chamado...');
        
        this.currentStructure = null;
        this.structureType = 'beam';
        this.isCalculated = false;
        this.renderer = null;
        this.canvas = null;
        this.ctx = null;
        this.ui = null;
        
        // Aguardar DOM estar pronto
        setTimeout(() => this.initApp(), 100);
    }
    
    initApp() {
        console.log('Inicializando Isostática Lab...');
        
        // 1. ENCONTRAR CANVAS
        this.canvas = document.getElementById('structure-canvas');
        
        if (!this.canvas) {
            console.error('❌ Canvas não encontrado!');
            // Tentar alternativas
            this.canvas = document.querySelector('canvas');
            if (!this.canvas) {
                console.error('Nenhum canvas encontrado na página!');
                return;
            }
        }
        
        console.log('✅ Canvas encontrado:', this.canvas);
        
        // Garantir dimensões
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
        
        // 2. OBTER CONTEXTO
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('❌ Não foi possível obter contexto 2D');
            return;
        }
        
        console.log('✅ Contexto 2D inicializado! Dimensões:', this.canvas.width, 'x', this.canvas.height);
        
        // 3. INICIALIZAR RENDERER (CORRIGIDO)
        this.renderer = new StructureRenderer(this.canvas, this.ctx);
        
        // 4. INICIALIZAR CONTROLES
        this.ui = new UIControls(this);
        
        // 5. CONFIGURAR EVENTOS
        this.setupBasicEventListeners();
        
        // 6. CONFIGURAR EVENTOS DO CANVAS (PARA DESENHO)
        this.setupCanvasEvents();
        
        // 7. CARREGAR MÓDULO PADRÃO
        this.loadStructureModule('beam');
        
        console.log('✅ Isostática Lab totalmente inicializado!');
    }
    
    setupBasicEventListeners() {
        console.log('Configurando listeners básicos...');
        
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
    
    setupCanvasEvents() {
        if (!this.canvas) return;
        
        console.log('Configurando eventos do canvas...');
        
        // Evento de CLIQUE para adicionar elementos
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            console.log('Clique no canvas:', x, y);
            
            // Converter para coordenadas do mundo
            if (this.renderer) {
                const worldPos = this.renderer.screenToWorld(x, y);
                console.log('Coordenadas mundo:', worldPos.x.toFixed(2), worldPos.y.toFixed(2));
                
                // Verificar qual ferramenta está ativa
                if (this.ui) {
                    const currentTool = this.ui.getCurrentTool();
                    console.log('Ferramenta ativa:', currentTool);
                    
                    // AÇÃO baseada na ferramenta
                    if (currentTool === 'node' && this.currentStructure && this.currentStructure.addNode) {
                        // Adicionar nó
                        const node = this.currentStructure.addNode(worldPos.x, worldPos.y);
                        console.log('Nó adicionado:', node);
                        
                        // Renderizar
                        this.renderer.render();
                        this.updateStructureInfo();
                        
                    } else if (currentTool === 'beam' && this.currentStructure && this.currentStructure.addBeam) {
                        // Para barras, precisamos de lógica de seleção
                        // Implementação SIMPLES: adiciona nó e conecta com último
                        const node = this.currentStructure.addNode(worldPos.x, worldPos.y);
                        console.log('Nó para barra:', node);
                        
                        // Se há pelo menos 2 nós, criar barra
                        if (this.currentStructure.nodes.length >= 2) {
                            const node1 = this.currentStructure.nodes[this.currentStructure.nodes.length - 2];
                            const node2 = this.currentStructure.nodes[this.currentStructure.nodes.length - 1];
                            const beam = this.currentStructure.addBeam(node1.id, node2.id);
                            console.log('Barra criada:', beam);
                        }
                        
                        this.renderer.render();
                        this.updateStructureInfo();
                        
                    } else if (currentTool === 'support' && this.currentStructure && this.currentStructure.addSupport) {
                        // Adicionar vínculo no último nó (simplificado)
                        if (this.currentStructure.nodes.length > 0) {
                            const lastNode = this.currentStructure.nodes[this.currentStructure.nodes.length - 1];
                            const supportType = this.ui.getCurrentSupportType();
                            const support = this.currentStructure.addSupport(lastNode.id, supportType);
                            console.log('Vínculo adicionado:', support);
                            
                            this.renderer.render();
                            this.updateStructureInfo();
                        }
                    }
                }
            }
        });
        
        // Evento de MOVIMENTO do mouse para mostrar coordenadas
        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            if (this.renderer) {
                const worldPos = this.renderer.screenToWorld(x, y);
                const coordDisplay = document.getElementById('coordinate-display');
                if (coordDisplay) {
                    coordDisplay.textContent = `X: ${worldPos.x.toFixed(2)} m, Y: ${worldPos.y.toFixed(2)} m`;
                }
            }
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
                if (typeof BeamStructure !== 'undefined') {
                    this.currentStructure = new BeamStructure();
                } else {
                    console.error('BeamStructure não definido! Verifique beam.js');
                    // Criar estrutura básica como fallback
                    this.currentStructure = this.createBasicStructure();
                }
                break;
            case 'frame':
                // Similar para outros tipos
                this.currentStructure = this.createBasicStructure();
                break;
            case 'grid':
                this.currentStructure = this.createBasicStructure();
                break;
            case 'arch':
                this.currentStructure = this.createBasicStructure();
                break;
        }
        
        // Atualizar renderizador
        if (this.renderer) {
            this.renderer.setStructure(this.currentStructure);
            this.renderer.render();
        }
        
        // Atualizar informações
        this.updateStructureInfo();
        
        console.log('Módulo carregado:', type);
    }
    
    // Estrutura básica como fallback
    createBasicStructure() {
        return {
            nodes: [],
            beams: [],
            supports: [],
            loads: [],
            addNode: function(x, y) {
                const node = {
                    id: this.nodes.length + 1,
                    x: x,
                    y: y
                };
                this.nodes.push(node);
                return node;
            },
            addBeam: function(startNodeId, endNodeId) {
                const startNode = this.nodes.find(n => n.id === startNodeId);
                const endNode = this.nodes.find(n => n.id === endNodeId);
                
                if (!startNode || !endNode) return null;
                
                const beam = {
                    id: this.beams.length + 1,
                    startNodeId: startNodeId,
                    endNodeId: endNodeId,
                    start: { x: startNode.x, y: startNode.y },
                    end: { x: endNode.x, y: endNode.y }
                };
                this.beams.push(beam);
                return beam;
            },
            addSupport: function(nodeId, type) {
                const support = {
                    id: this.supports.length + 1,
                    nodeId: nodeId,
                    type: type
                };
                this.supports.push(support);
                return support;
            }
        };
    }
    
    loadExample(exampleId) {
        console.log(`Carregando exemplo: ${exampleId}`);
        // Implementação básica
        if (exampleId === 'beam-simple') {
            this.loadStructureModule('beam');
            // Adicionar exemplo simples
            setTimeout(() => {
                if (this.currentStructure) {
                    const node1 = this.currentStructure.addNode(1, 1);
                    const node2 = this.currentStructure.addNode(5, 1);
                    this.currentStructure.addBeam(node1.id, node2.id);
                    this.currentStructure.addSupport(node1.id, 'pinned');
                    this.currentStructure.addSupport(node2.id, 'roller');
                    
                    if (this.renderer) {
                        this.renderer.render();
                        this.updateStructureInfo();
                    }
                }
            }, 500);
        }
    }
    
    updateStructureInfo() {
        if (!this.currentStructure) return;
        
        const barCount = document.getElementById('bar-count');
        const nodeCount = document.getElementById('node-count');
        const staticDegree = document.getElementById('static-degree');
        
        if (barCount) barCount.textContent = this.currentStructure.beams?.length || 0;
        if (nodeCount) nodeCount.textContent = this.currentStructure.nodes?.length || 0;
        if (staticDegree) staticDegree.textContent = '0';
    }
    
    updateStatusMessage(message) {
        const status = document.getElementById('status-message');
        if (status) status.textContent = message;
    }
    
    calculateStructure() {
        this.updateStatusMessage('Cálculo realizado (simulação)');
        this.isCalculated = true;
        
        const calcStatus = document.getElementById('calc-status');
        if (calcStatus) {
            calcStatus.innerHTML = '<i class="fas fa-check-circle"></i> Calculado';
        }
        
        if (this.ui) {
            this.ui.showToast('Cálculo simulado realizado!', 'success');
        }
    }
    
    resetStructure() {
        if (confirm('Reiniciar estrutura?')) {
            this.loadStructureModule(this.structureType);
            this.updateStatusMessage('Estrutura reiniciada');
        }
    }
    
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabContent = document.getElementById(`tab-${tabId}`);
        if (tabContent) tabContent.classList.add('active');
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTab) activeTab.classList.add('active');
    }
}

// Inicialização única
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando app...');
    setTimeout(() => {
        window.app = new IsostaticaApp();
    }, 100);
});

// Para acesso global
if (typeof window !== 'undefined') {
    window.IsostaticaApp = IsostaticaApp;
}

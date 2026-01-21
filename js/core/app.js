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
        this.selectedNodeForBeam = null; // Para criação de barras em duas etapas
        this.tempBeamPreview = null; // Para preview de barra
        
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
        
        // 3. INICIALIZAR RENDERER
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
                    // Resetar seleção de barra
                    this.selectedNodeForBeam = null;
                    this.clearNodeHighlight();
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
                    // Resetar seleção de barra
                    this.selectedNodeForBeam = null;
                    this.clearNodeHighlight();
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
                        this.updateStatusMessage(`Nó N${node.id} adicionado em (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`);
                        
                    } else if (currentTool === 'beam' && this.currentStructure && this.currentStructure.addBeam) {
                        // NOVA LÓGICA: Criação de barras em duas etapas
                        this.handleBeamCreation(worldPos.x, worldPos.y);
                        
                    } else if (currentTool === 'support' && this.currentStructure && this.currentStructure.addSupport) {
                        // Adicionar vínculo no nó mais próximo
                        const closestNode = this.findClosestNode(worldPos.x, worldPos.y, 0.3);
                        if (closestNode) {
                            const supportType = this.ui.getCurrentSupportType();
                            const support = this.currentStructure.addSupport(closestNode.id, supportType);
                            console.log('Vínculo adicionado:', support);
                            
                            this.renderer.render();
                            this.updateStructureInfo();
                            this.updateStatusMessage(`Vínculo ${supportType} adicionado ao Nó N${closestNode.id}`);
                        } else {
                            this.updateStatusMessage('Clique perto de um nó para adicionar vínculo.');
                        }
                        
                    } else if (currentTool === 'delete' && this.currentStructure) {
                        // Excluir elemento mais próximo
                        this.deleteClosestElement(worldPos.x, worldPos.y);
                    }
                }
            }
        });
        
        // Evento de MOVIMENTO do mouse para mostrar coordenadas e preview de barra
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
                
                // Preview de barra se temos um nó inicial selecionado
                if (this.selectedNodeForBeam && this.ui.getCurrentTool() === 'beam') {
                    this.tempBeamPreview = {
                        start: this.selectedNodeForBeam,
                        end: worldPos
                    };
                    this.renderer.render();
                    this.drawBeamPreview();
                }
            }
        });
        
        // Cancelar criação de barra com ESC ou clique direito
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.selectedNodeForBeam) {
                this.cancelBeamCreation();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.selectedNodeForBeam) {
                this.cancelBeamCreation();
            }
        });
    }
    
    handleBeamCreation(worldX, worldY) {
        // Se não temos um nó inicial selecionado
        if (!this.selectedNodeForBeam) {
            // Encontrar nó mais próximo do clique
            const closestNode = this.findClosestNode(worldX, worldY, 0.3);
            
            if (closestNode) {
                // Selecionar este nó como início da barra
                this.selectedNodeForBeam = closestNode;
                this.updateStatusMessage(`Nó N${closestNode.id} selecionado. Clique em outro nó para criar a barra (ESC para cancelar)`);
                
                // Destacar visualmente
                this.highlightNode(closestNode);
                this.renderer.render(); // Re-render para mostrar destaque
            } else {
                this.updateStatusMessage('Clique perto de um nó existente ou adicione nós primeiro.');
            }
        } 
        // Se já temos um nó inicial, este é o segundo clique
        else {
            // Encontrar nó mais próximo para ser o final
            const closestNode = this.findClosestNode(worldX, worldY, 0.3);
            
            if (closestNode && closestNode.id !== this.selectedNodeForBeam.id) {
                // Criar barra entre os dois nós
                const beam = this.currentStructure.addBeam(
                    this.selectedNodeForBeam.id, 
                    closestNode.id
                );
                
                if (beam) {
                    console.log('✅ Barra criada:', beam);
                    this.updateStatusMessage(`Barra B${beam.id} criada entre N${this.selectedNodeForBeam.id} e N${closestNode.id}`);
                    
                    // Renderizar e atualizar
                    this.renderer.render();
                    this.updateStructureInfo();
                }
            } else if (closestNode) {
                this.updateStatusMessage('Não pode criar barra entre o mesmo nó.');
            } else {
                this.updateStatusMessage('Nó final não encontrado. Clique perto de um nó existente.');
            }
            
            // Resetar seleção
            this.cancelBeamCreation();
        }
    }
    
    drawBeamPreview() {
        if (!this.tempBeamPreview || !this.renderer) return;
        
        const ctx = this.renderer.ctx;
        const start = this.renderer.worldToScreen(
            this.tempBeamPreview.start.x,
            this.tempBeamPreview.start.y
        );
        const end = this.renderer.worldToScreen(
            this.tempBeamPreview.end.x,
            this.tempBeamPreview.end.y
        );
        
        ctx.save();
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)'; // Azul semi-transparente
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Linha tracejada
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        
        ctx.restore();
    }
    
    cancelBeamCreation() {
        this.clearNodeHighlight();
        this.selectedNodeForBeam = null;
        this.tempBeamPreview = null;
        this.updateStatusMessage('Criação de barra cancelada.');
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    // Método auxiliar para encontrar nó mais próximo
    findClosestNode(x, y, maxDistance = 0.5) {
        if (!this.currentStructure || !this.currentStructure.nodes || this.currentStructure.nodes.length === 0) {
            return null;
        }
        
        let closestNode = null;
        let closestDist = Infinity;
        
        this.currentStructure.nodes.forEach(node => {
            const dist = Math.sqrt(
                Math.pow(node.x - x, 2) + 
                Math.pow(node.y - y, 2)
            );
            
            if (dist < closestDist && dist < maxDistance) {
                closestDist = dist;
                closestNode = node;
            }
        });
        
        return closestNode;
    }
    
    // Destacar nó visualmente
    highlightNode(node) {
        if (!node || !this.renderer) return;
        
        // Marcar o nó como destacado
        node._highlighted = true;
        
        // Re-renderizar para mostrar destaque
        this.renderer.render();
    }
    
    // Limpar destaque
    clearNodeHighlight() {
        if (!this.currentStructure || !this.currentStructure.nodes) return;
        
        this.currentStructure.nodes.forEach(node => {
            delete node._highlighted;
        });
        
        if (this.renderer) {
            this.renderer.render();
        }
    }
    
    // Excluir elemento mais próximo
    deleteClosestElement(x, y) {
        if (!this.currentStructure) return;
        
        // Primeiro verificar nós
        const closestNode = this.findClosestNode(x, y, 0.5);
        if (closestNode) {
            // Remover barras conectadas a este nó
            this.currentStructure.beams = this.currentStructure.beams.filter(beam => 
                beam.startNodeId !== closestNode.id && beam.endNodeId !== closestNode.id
            );
            
            // Remover vínculos deste nó
            this.currentStructure.supports = this.currentStructure.supports.filter(support => 
                support.nodeId !== closestNode.id
            );
            
            // Remover o nó
            const nodeIndex = this.currentStructure.nodes.findIndex(n => n.id === closestNode.id);
            if (nodeIndex !== -1) {
                this.currentStructure.nodes.splice(nodeIndex, 1);
                console.log(`Nó N${closestNode.id} removido`);
                this.updateStatusMessage(`Nó N${closestNode.id} removido`);
                
                this.renderer.render();
                this.updateStructureInfo();
                return;
            }
        }
        
        // Se não encontrou nó, verificar barras
        let closestBeam = null;
        let closestBeamDist = Infinity;
        
        this.currentStructure.beams.forEach(beam => {
            const startNode = this.currentStructure.nodes.find(n => n.id === beam.startNodeId);
            const endNode = this.currentStructure.nodes.find(n => n.id === beam.endNodeId);
            
            if (startNode && endNode) {
                // Calcular distância do ponto à linha da barra
                const dist = this.distanceToLine(x, y, startNode.x, startNode.y, endNode.x, endNode.y);
                if (dist < closestBeamDist && dist < 0.3) {
                    closestBeamDist = dist;
                    closestBeam = beam;
                }
            }
        });
        
        if (closestBeam) {
            // Remover a barra
            const beamIndex = this.currentStructure.beams.findIndex(b => b.id === closestBeam.id);
            if (beamIndex !== -1) {
                this.currentStructure.beams.splice(beamIndex, 1);
                console.log(`Barra B${closestBeam.id} removida`);
                this.updateStatusMessage(`Barra B${closestBeam.id} removida`);
                
                this.renderer.render();
                this.updateStructureInfo();
            }
        } else {
            this.updateStatusMessage('Nenhum elemento próximo para excluir.');
        }
    }
    
    // Calcular distância de ponto a linha
    distanceToLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
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
        
        // Cancelar qualquer criação de barra em andamento
        this.cancelBeamCreation();
        
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
        
        // Criar nova estrutura básica
        this.currentStructure = this.createBasicStructure();
        this.currentStructure.type = type;
        
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
            type: 'beam',
            nextNodeId: 1,
            nextBeamId: 1,
            addNode: function(x, y) {
                const node = {
                    id: this.nextNodeId++,
                    x: x,
                    y: y,
                    loads: [],
                    support: null
                };
                this.nodes.push(node);
                console.log('Nó adicionado:', node);
                return node;
            },
            addBeam: function(startNodeId, endNodeId) {
                const startNode = this.nodes.find(n => n.id === startNodeId);
                const endNode = this.nodes.find(n => n.id === endNodeId);
                
                if (!startNode || !endNode) {
                    console.error('Nós não encontrados para barra');
                    return null;
                }
                
                const dx = endNode.x - startNode.x;
                const dy = endNode.y - startNode.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                const beam = {
                    id: this.nextBeamId++,
                    startNodeId: startNodeId,
                    endNodeId: endNodeId,
                    start: { x: startNode.x, y: startNode.y },
                    end: { x: endNode.x, y: endNode.y },
                    length: length,
                    angle: Math.atan2(dy, dx),
                    distributedLoads: []
                };
                
                this.beams.push(beam);
                console.log('Barra adicionada:', beam);
                return beam;
            },
            addSupport: function(nodeId, type) {
                const node = this.nodes.find(n => n.id === nodeId);
                if (!node) {
                    console.error('Nó não encontrado para vínculo');
                    return null;
                }
                
                const support = {
                    nodeId: nodeId,
                    type: type
                };
                
                node.support = support;
                
                // Adicionar à lista de supports da estrutura
                const existingIndex = this.supports.findIndex(s => s.nodeId === nodeId);
                if (existingIndex !== -1) {
                    this.supports[existingIndex] = support;
                } else {
                    this.supports.push(support);
                }
                
                console.log('Vínculo adicionado:', support);
                return support;
            },
            addPointLoad: function(nodeId, magnitude, direction = 270) {
                const node = this.nodes.find(n => n.id === nodeId);
                if (!node) {
                    console.error('Nó não encontrado para carga');
                    return null;
                }
                
                const load = {
                    type: 'point',
                    magnitude: magnitude,
                    direction: direction
                };
                
                node.loads.push(load);
                this.loads.push({ ...load, nodeId: nodeId });
                
                console.log('Carga adicionada:', load);
                return load;
            },
            getNodeById: function(id) {
                return this.nodes.find(n => n.id === id);
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
                    const node1 = this.currentStructure.addNode(0, 0);
                    const node2 = this.currentStructure.addNode(6, 0);
                    this.currentStructure.addBeam(node1.id, node2.id);
                    this.currentStructure.addSupport(node1.id, 'pinned');
                    this.currentStructure.addSupport(node2.id, 'roller');
                    
                    if (this.renderer) {
                        this.renderer.render();
                        this.updateStructureInfo();
                        this.updateStatusMessage('Exemplo: Viga biapoiada simples carregada');
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
            this.cancelBeamCreation();
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

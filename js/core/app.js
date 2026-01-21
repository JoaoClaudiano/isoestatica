// Isostática Lab - Aplicação Principal
constructor() {
    this.currentStructure = null;
    this.structureType = 'beam';
    this.currentTool = 'select';
    this.selectedElement = null;
    this.isCalculated = false;
    this.renderer = null;
    this.calculator = null;
    this.ui = null;
    this.canvasHandler = null;
    
    this.init();
}

init() {
    // Configurar eventos
    this.setupEventListeners();
    
    // Inicializar renderizador
    this.renderer = new StructureRenderer('structure-canvas');
    
    // Inicializar calculadora
    this.calculator = new StructureCalculator();
    
    // Inicializar interface
    this.ui = new UIControls(this);
    
    // Inicializar manipulador do canvas
    this.canvasHandler = new CanvasHandler(this, this.renderer);
    
    // Inicializar módulo atual (viga por padrão)
    this.loadStructureModule('beam');
    
    // Mostrar tela de boas-vindas
    this.showWelcomeScreen();
}
    
    setupEventListeners() {
        // Navegação
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showWelcomeScreen();
        });
        
        // Seleção de estrutura
        document.querySelectorAll('.structure-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-select')) {
                    const type = card.dataset.type;
                    this.loadStructureModule(type);
                    this.hideWelcomeScreen();
                }
            });
        });
        
        // Exemplos
        document.getElementById('example-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadExample(e.target.value);
                this.hideWelcomeScreen();
            }
        });
        
        // Pular tutorial
        document.getElementById('skip-tutorial').addEventListener('click', () => {
            this.hideWelcomeScreen();
        });
        
        // Ferramentas
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTool(btn.dataset.tool);
            });
        });
        
        // Vínculos
        document.querySelectorAll('.support-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTool = 'support';
                this.selectedSupportType = btn.dataset.support;
                this.updateUI();
            });
        });
        
        // Cargas
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTool = 'load';
                this.selectedLoadType = btn.dataset.load;
                this.updateUI();
            });
        });
        
        // Calcular
        document.getElementById('btn-calculate').addEventListener('click', () => {
            this.calculateStructure();
        });
        
        // Reiniciar
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.resetStructure();
        });
        
        // Controles do canvas
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.renderer.zoomIn();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.renderer.zoomOut();
        });
        
        document.getElementById('fit-view').addEventListener('click', () => {
            this.renderer.fitToView();
        });
        
        // Toggles de diagramas
        document.getElementById('toggle-N').addEventListener('change', (e) => {
            this.renderer.toggleDiagram('N', e.target.checked);
        });
        
        document.getElementById('toggle-V').addEventListener('change', (e) => {
            this.renderer.toggleDiagram('V', e.target.checked);
        });
        
        document.getElementById('toggle-M').addEventListener('change', (e) => {
            this.renderer.toggleDiagram('M', e.target.checked);
        });
        
        document.getElementById('toggle-T').addEventListener('change', (e) => {
            this.renderer.toggleDiagram('T', e.target.checked);
        });
        
        document.getElementById('toggle-deformed').addEventListener('change', (e) => {
            this.renderer.toggleDeformedShape(e.target.checked);
        });
        
        // Abas do painel direito
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(tab.dataset.tab);
            });
        });
        
        // Atualizar coordenadas
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const worldCoords = this.renderer.screenToWorld(x, y);
            
            document.getElementById('coordinate-display').textContent = 
                `X: ${worldCoords.x.toFixed(2)} m, Y: ${worldCoords.y.toFixed(2)} m`;
        });
    }
    
    showWelcomeScreen() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('main-interface').style.display = 'none';
    }
    
    hideWelcomeScreen() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('main-interface').style.display = 'flex';
    }
    
    loadStructureModule(type) {
        this.structureType = type;
        
        // Atualizar interface
        document.getElementById('structure-title').textContent = 
            type === 'beam' ? 'Viga Isostática' :
            type === 'frame' ? 'Pórtico Plano' :
            type === 'grid' ? 'Grelha Isostática' :
            'Arco Isostático';
        
        document.getElementById('structure-type-indicator').textContent = 
            type === 'beam' ? 'VIGA' :
            type === 'frame' ? 'PÓRTICO' :
            type === 'grid' ? 'GRELIHA' : 'ARCO';
        
        // Mostrar/ocultar controles específicos
        const torsionToggle = document.getElementById('toggle-T');
        if (type === 'grid') {
            torsionToggle.parentElement.classList.remove('hidden');
        } else {
            torsionToggle.parentElement.classList.add('hidden');
            torsionToggle.checked = false;
            this.renderer.toggleDiagram('T', false);
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
        this.renderer.setStructure(this.currentStructure);
        
        // Resetar estado
        this.isCalculated = false;
        this.updateStatus();
        
        // Renderizar
        this.renderer.render();
    }
    
    loadExample(exampleId) {
        // Carregar exemplo predefinido
        let exampleStructure = null;
        
        switch(exampleId) {
            case 'beam-simple':
                this.loadStructureModule('beam');
                exampleStructure = this.createSimpleBeamExample();
                break;
            case 'beam-cantilever':
                this.loadStructureModule('beam');
                exampleStructure = this.createCantileverBeamExample();
                break;
            case 'frame-portico':
                this.loadStructureModule('frame');
                exampleStructure = this.createFrameExample();
                break;
            case 'grid-simple':
                this.loadStructureModule('grid');
                exampleStructure = this.createGridExample();
                break;
        }
        
        if (exampleStructure) {
            this.currentStructure = exampleStructure;
            this.renderer.setStructure(this.currentStructure);
            this.renderer.render();
        }
    }
    
    createSimpleBeamExample() {
        const beam = new BeamStructure();
        
        // Nós em (0,0) e (6,0)
        const node1 = beam.addNode(0, 0);
        const node2 = beam.addNode(6, 0);
        
        // Barra entre os nós
        beam.addBeam(node1, node2);
        
        // Apoios
        beam.addSupport(node1, 'pinned');
        beam.addSupport(node2, 'roller');
        
        // Carga pontual no meio
        beam.addPointLoad(node2, 10, 270); // 10 kN para baixo
        
        return beam;
    }
    
    setTool(tool) {
        this.currentTool = tool;
        
        // Atualizar UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`tool-${tool}`).classList.add('active');
        
        this.updateStatusMessage(`Ferramenta: ${this.getToolName(tool)}`);
    }
    
    getToolName(tool) {
        const names = {
            'select': 'Selecionar',
            'node': 'Adicionar Nó',
            'beam': 'Adicionar Barra',
            'delete': 'Excluir',
            'support': 'Adicionar Vínculo',
            'load': 'Adicionar Carga'
        };
        return names[tool] || tool;
    }
    
    handleCanvasClick(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldCoords = this.renderer.screenToWorld(x, y);
        
        switch(this.currentTool) {
            case 'node':
                this.addNode(worldCoords.x, worldCoords.y);
                break;
            case 'beam':
                this.addBeamAt(worldCoords.x, worldCoords.y);
                break;
            case 'support':
                this.addSupportAt(worldCoords.x, worldCoords.y);
                break;
            case 'load':
                this.addLoadAt(worldCoords.x, worldCoords.y);
                break;
            case 'delete':
                this.deleteAt(worldCoords.x, worldCoords.y);
                break;
            case 'select':
                this.selectAt(worldCoords.x, worldCoords.y);
                break;
        }
        
        this.renderer.render();
    }
    
    addNode(x, y) {
        if (!this.currentStructure) return;
        
        const node = this.currentStructure.addNode(x, y);
        this.updateStructureInfo();
        this.updateStatusMessage(`Nó adicionado em (${x.toFixed(2)}, ${y.toFixed(2)})`);
        
        // Renderizar novamente
        this.renderer.render();
        
        return node;
    }
        
    addBeamAt(x, y) {
        // Encontrar nó mais próximo
        const node = this.findNearestNode(x, y, 0.5); // 0.5m de tolerância
        
        if (node && this.selectedElement?.type === 'node') {
            // Conectar nó selecionado ao nó mais próximo
            this.currentStructure.addBeam(this.selectedElement.element, node);
            this.selectedElement = null;
            this.updateStructureInfo();
            this.updateStatusMessage('Barra adicionada');
        } else if (node) {
            // Selecionar nó para conectar
            this.selectedElement = { type: 'node', element: node };
            this.updateSelectionInfo();
            this.updateStatusMessage('Clique em outro nó para conectar');
        }
    }
    
    addSupportAt(x, y) {
        const node = this.findNearestNode(x, y, 0.5);
        if (node && this.selectedSupportType) {
            this.currentStructure.addSupport(node, this.selectedSupportType);
            this.updateStructureInfo();
            this.updateStatusMessage(`Vínculo ${this.selectedSupportType} adicionado`);
        }
    }
    
    addLoadAt(x, y) {
        const magnitude = parseFloat(document.getElementById('load-magnitude').value);
        const direction = parseFloat(document.getElementById('load-direction').value);
        
        if (this.selectedLoadType === 'point') {
            const node = this.findNearestNode(x, y, 0.5);
            if (node) {
                this.currentStructure.addPointLoad(node, magnitude, direction);
                this.updateStatusMessage(`Carga pontual de ${magnitude} kN adicionada`);
            }
        } else if (this.selectedLoadType === 'distributed') {
            // Implementar carga distribuída
        } else if (this.selectedLoadType === 'moment') {
            const node = this.findNearestNode(x, y, 0.5);
            if (node) {
                this.currentStructure.addMoment(node, magnitude);
                this.updateStatusMessage(`Momento de ${magnitude} kN.m adicionado`);
            }
        }
    }
    
    deleteAt(x, y) {
        // Implementar exclusão
    }
    
    selectAt(x, y) {
        // Implementar seleção
    }
    
    findNearestNode(x, y, tolerance) {
        let nearest = null;
        let minDist = Infinity;
        
        this.currentStructure.nodes.forEach(node => {
            const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            if (dist < minDist && dist < tolerance) {
                minDist = dist;
                nearest = node;
            }
        });
        
        return nearest;
    }
    
    calculateStructure() {
        if (!this.currentStructure) return;
        
        try {
            // Verificar se é isostática
            const isIsostatic = this.calculator.checkIsostaticity(this.currentStructure);
            
            if (!isIsostatic) {
                this.showToast('Estrutura não é isostática! Verifique os vínculos.', 'error');
                return;
            }
            
            // Calcular reações
            const reactions = this.calculator.calculateReactions(this.currentStructure);
            
            // Calcular esforços internos
            const internalForces = this.calculator.calculateInternalForces(this.currentStructure);
            
            // Atualizar estrutura com resultados
            this.currentStructure.reactions = reactions;
            this.currentStructure.internalForces = internalForces;
            
            // Atualizar diagramas no renderizador
            this.renderer.setResults(reactions, internalForces);
            
            // Atualizar UI
            this.isCalculated = true;
            this.updateResults(reactions, internalForces);
            this.updateStatus();
            
            this.showToast('Cálculo realizado com sucesso!', 'success');
            
        } catch (error) {
            this.showToast(`Erro no cálculo: ${error.message}`, 'error');
        }
    }
    
    updateResults(reactions, internalForces) {
        // Atualizar reações de apoio
        const reactionsContainer = document.getElementById('reactions-container');
        reactionsContainer.innerHTML = '';
        
        Object.entries(reactions).forEach(([nodeId, reaction]) => {
            const div = document.createElement('div');
            div.className = 'reaction-item';
            div.innerHTML = `
                <strong>Nó ${nodeId}:</strong><br>
                Fx = ${reaction.Fx?.toFixed(2) || 0} kN<br>
                Fy = ${reaction.Fy?.toFixed(2) || 0} kN<br>
                Mz = ${reaction.Mz?.toFixed(2) || 0} kN.m
            `;
            reactionsContainer.appendChild(div);
        });
        
        // Atualizar valores extremos
        const extremesContainer = document.getElementById('extremes-container');
        extremesContainer.innerHTML = '';
        
        if (internalForces.extremes) {
            Object.entries(internalForces.extremes).forEach(([type, extremes]) => {
                const div = document.createElement('div');
                div.className = 'extremes-item';
                div.innerHTML = `
                    <strong>${type}:</strong><br>
                    Máx = ${extremes.max?.toFixed(2) || 0}<br>
                    Min = ${extremes.min?.toFixed(2) || 0}
                `;
                extremesContainer.appendChild(div);
            });
        }
    }
    
    updateStructureInfo() {
        document.getElementById('bar-count').textContent = this.currentStructure.beams.length;
        document.getElementById('node-count').textContent = this.currentStructure.nodes.length;
        
        // Calcular grau de estaticidade
        const degree = this.calculator.calculateStaticDegree(this.currentStructure);
        document.getElementById('static-degree').textContent = degree;
        
        // Atualizar indicador
        const indicator = document.getElementById('isostatic-indicator');
        indicator.textContent = degree === 0 ? 'ISOSTÁTICA' : degree > 0 ? 'HIPOSTÁTICA' : 'HIPERESTÁTICA';
        indicator.className = `status-badge ${degree === 0 ? 'isostatic' : degree > 0 ? 'hypostatic' : 'hyperstatic'}`;
    }
    
    updateStatus() {
        const status = document.getElementById('calc-status');
        if (this.isCalculated) {
            status.innerHTML = '<i class="fas fa-check-circle"></i> Calculado';
            status.style.color = 'var(--success-color)';
        } else {
            status.innerHTML = '<i class="fas fa-sync-alt"></i> Não calculado';
            status.style.color = 'var(--text-secondary)';
        }
    }
    
    updateStatusMessage(message) {
        document.getElementById('status-message').textContent = message;
    }
    
    updateSelectionInfo() {
        const info = document.getElementById('selection-info');
        if (this.selectedElement) {
            info.classList.remove('hidden');
            document.getElementById('selected-element').textContent = 
                `${this.selectedElement.type} selecionado`;
        } else {
            info.classList.add('hidden');
        }
    }
    
    switchTab(tabId) {
        // Atualizar abas
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Mostrar conteúdo da aba
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');
    }
    
    resetStructure() {
        if (confirm('Tem certeza que deseja reiniciar a estrutura? Todos os dados serão perdidos.')) {
            this.loadStructureModule(this.structureType);
            this.updateStatusMessage('Estrutura reiniciada');
        }
    }
    
    showToast(message, type = 'info') {
        // Implementar sistema de notificações
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IsostaticaApp();
});

// Controles da interface do usuário - Versão Simplificada
class UIControls {
    constructor(app) {
        this.app = app;
        this.currentTool = 'select';
        this.currentLoadType = 'point';
        this.currentSupportType = 'pinned';
        // Delay da inicialização até que o DOM esteja pronto
        setTimeout(() => this.init(), 100);
    }

    init() {
        console.log('Inicializando UIControls...');
        this.setupEventListeners();
        // Ativar ferramenta padrão
        this.setTool('select');
    }

    setupEventListeners() {
        console.log('Configurando listeners...');
        
        // Ferramentas
        this.addClickListener('.tool-btn', (btn) => {
            const tool = btn.getAttribute('data-tool');
            if (tool) this.setTool(tool);
        });

        // Vínculos
        this.addClickListener('.support-btn', (btn) => {
            const support = btn.getAttribute('data-support');
            if (support) this.setSupportType(support);
        });

        // Cargas
        this.addClickListener('.load-btn', (btn) => {
            const load = btn.getAttribute('data-load');
            if (load) this.setLoadType(load);
        });

        // Outros controles
        this.setupOtherControls();
    }

    addClickListener(selector, callback) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                callback(element);
            });
        });
    }

    setupOtherControls() {
        // Zoom
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const fitView = document.getElementById('fit-view');
        
        if (zoomIn) zoomIn.addEventListener('click', () => this.app.renderer?.zoomIn());
        if (zoomOut) zoomOut.addEventListener('click', () => this.app.renderer?.zoomOut());
        if (fitView) fitView.addEventListener('click', () => this.app.renderer?.fitToView());
        
        // Botões principais
        const calculateBtn = document.getElementById('btn-calculate');
        const resetBtn = document.getElementById('btn-reset');
        const exportBtn = document.getElementById('btn-export');
        
        if (calculateBtn) calculateBtn.addEventListener('click', () => this.app.calculateStructure?.());
        if (resetBtn) resetBtn.addEventListener('click', () => this.app.resetStructure?.());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportStructure());
        
        // Toggles de diagramas
        ['N', 'V', 'M', 'T'].forEach(type => {
            const toggle = document.getElementById(`toggle-${type}`);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.app.renderer?.toggleDiagram?.(type, e.target.checked);
                });
            }
        });
        
        const deformedToggle = document.getElementById('toggle-deformed');
        if (deformedToggle) {
            deformedToggle.addEventListener('change', (e) => {
                this.app.renderer?.toggleDeformedShape?.(e.target.checked);
            });
        }
    }

    setTool(tool) {
        console.log(`Mudando ferramenta para: ${tool}`);
        this.currentTool = tool;
        
        // Remover active de todos os botões de ferramenta
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar active ao botão atual
        const currentBtn = document.getElementById(`tool-${tool}`);
        if (currentBtn) {
            currentBtn.classList.add('active');
        }
        
        // Atualizar cursor do canvas
        const canvas = document.getElementById('structure-canvas');
        if (canvas) {
            const cursors = {
                'select': 'default',
                'node': 'crosshair',
                'beam': 'crosshair',
                'delete': 'not-allowed',
                'pan': 'grab'
            };
            canvas.style.cursor = cursors[tool] || 'default';
        }
        
        if (this.app.updateStatusMessage) {
            this.app.updateStatusMessage(`Ferramenta: ${this.getToolName(tool)}`);
        }
    }

    setSupportType(type) {
        console.log(`Selecionando vínculo: ${type}`);
        this.currentSupportType = type;
        this.currentTool = 'support';
        
        if (this.app.updateStatusMessage) {
            this.app.updateStatusMessage(`Vínculo selecionado: ${this.getSupportName(type)}`);
        }
    }

    setLoadType(type) {
        console.log(`Selecionando carga: ${type}`);
        this.currentLoadType = type;
        this.currentTool = 'load';
        
        // Mostrar/ocultar propriedades específicas
        const distProps = document.getElementById('distributed-props');
        if (distProps) {
            distProps.classList.toggle('hidden', type !== 'distributed');
        }
        
        if (this.app.updateStatusMessage) {
            this.app.updateStatusMessage(`Carga selecionada: ${this.getLoadName(type)}`);
        }
    }

    getToolName(tool) {
        const names = {
            'select': 'Selecionar',
            'node': 'Nó',
            'beam': 'Barra',
            'delete': 'Excluir',
            'pan': 'Mover Vista'
        };
        return names[tool] || tool;
    }

    getSupportName(type) {
        const names = {
            'roller': 'Apoio Móvel',
            'pinned': 'Apoio Fixo',
            'fixed': 'Engaste',
            'hinge': 'Rótula'
        };
        return names[type] || type;
    }

    getLoadName(type) {
        const names = {
            'point': 'Pontual',
            'distributed': 'Distribuída',
            'moment': 'Momento'
        };
        return names[type] || type;
    }

    getCurrentTool() {
        return this.currentTool;
    }

    getCurrentLoadType() {
        return this.currentLoadType;
    }

    getCurrentSupportType() {
        return this.currentSupportType;
    }

    exportStructure() {
        alert('Funcionalidade de exportação será implementada em breve.');
    }

    showToast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Controles da interface - CORRIGIDO e integrado com app
class UIControls {
    constructor(app) {
        this.app = app;
        this.currentTool = 'select';
        this.currentLoadType = 'point';
        this.currentSupportType = 'pinned';
        
        console.log('UIControls criado para app:', app);
        setTimeout(() => this.init(), 50);
    }

    init() {
        console.log('Inicializando UIControls...');
        this.setupEventListeners();
        this.setTool('select');
        console.log('UIControls pronto!');
    }

    setupEventListeners() {
        console.log('Configurando listeners...');
        
        // Ferramentas
        this.addClickListener('.tool-btn', (btn) => {
            const tool = btn.getAttribute('data-tool');
            if (tool) {
                this.setTool(tool);
                // Atualizar app
                if (this.app.updateStatusMessage) {
                    this.app.updateStatusMessage(`Ferramenta: ${this.getToolName(tool)}`);
                }
            }
        });

        // Vínculos
        this.addClickListener('.support-btn', (btn) => {
            const support = btn.getAttribute('data-support');
            if (support) {
                this.setSupportType(support);
                // Mudar automaticamente para ferramenta de vínculo
                this.setTool('support');
            }
        });

        // Cargas
        this.addClickListener('.load-btn', (btn) => {
            const load = btn.getAttribute('data-load');
            if (load) {
                this.setLoadType(load);
                // Mudar automaticamente para ferramenta de carga
                this.setTool('load');
            }
        });

        // Outros controles
        this.setupOtherControls();
    }

    addClickListener(selector, callback) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback(element);
            });
        });
    }

    setupOtherControls() {
        console.log('Configurando outros controles...');
        
        // Zoom
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const fitView = document.getElementById('fit-view');
        const panView = document.getElementById('pan-view');
        
        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                console.log('Zoom In');
                if (this.app.renderer) this.app.renderer.zoomIn();
            });
        }
        
        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                console.log('Zoom Out');
                if (this.app.renderer) this.app.renderer.zoomOut();
            });
        }
        
        if (fitView) {
            fitView.addEventListener('click', () => {
                console.log('Ajustar à vista');
                if (this.app.renderer) this.app.renderer.fitToView();
            });
        }
        
        if (panView) {
            panView.addEventListener('click', () => {
                console.log('Ferramenta mover');
                this.setTool('pan');
            });
        }
        
        // Botões principais
        const calculateBtn = document.getElementById('btn-calculate');
        const resetBtn = document.getElementById('btn-reset');
        const exportBtn = document.getElementById('btn-export');
        
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                console.log('Calcular estrutura');
                if (this.app.calculateStructure) this.app.calculateStructure();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('Reiniciar estrutura');
                if (this.app.resetStructure) this.app.resetStructure();
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStructure());
        }
        
        // Toggles de diagramas
        ['N', 'V', 'M', 'T'].forEach(type => {
            const toggle = document.getElementById(`toggle-${type}`);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    console.log(`Diagrama ${type}: ${e.target.checked}`);
                    if (this.app.renderer) {
                        this.app.renderer.toggleDiagram(type, e.target.checked);
                    }
                });
            }
        });
        
        const deformedToggle = document.getElementById('toggle-deformed');
        if (deformedToggle) {
            deformedToggle.addEventListener('change', (e) => {
                console.log(`Forma deformada: ${e.target.checked}`);
                if (this.app.renderer) {
                    this.app.renderer.toggleDeformedShape(e.target.checked);
                }
            });
        }
        
        // Botão tela cheia
        const fullscreenBtn = document.getElementById('btn-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        // Botão ajuda
        const helpBtn = document.getElementById('btn-help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                alert('Isostática Lab - Ajuda\n\n1. Selecione uma ferramenta\n2. Clique no canvas para adicionar elementos\n3. Use os botões de zoom para navegar');
            });
        }
        
        console.log('Todos os controles configurados!');
    }

    setTool(tool) {
        console.log(`Mudando ferramenta para: ${tool}`);
        this.currentTool = tool;
        
        // Remover active de todos
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar active ao atual
        const currentBtn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
        if (currentBtn) {
            currentBtn.classList.add('active');
        } else {
            // Tentar pelo ID
            const btnById = document.getElementById(`tool-${tool}`);
            if (btnById) btnById.classList.add('active');
        }
        
        // Atualizar cursor
        const canvas = document.getElementById('structure-canvas');
        if (canvas) {
            const cursors = {
                'select': 'default',
                'node': 'crosshair',
                'beam': 'crosshair',
                'delete': 'not-allowed',
                'support': 'crosshair',
                'load': 'crosshair',
                'pan': 'grab'
            };
            canvas.style.cursor = cursors[tool] || 'default';
        }
    }

    setSupportType(type) {
        console.log(`Selecionando vínculo: ${type}`);
        this.currentSupportType = type;
        
        // Atualizar UI
        document.querySelectorAll('.support-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const currentBtn = document.querySelector(`.support-btn[data-support="${type}"]`);
        if (currentBtn) {
            currentBtn.classList.add('active');
        }
    }

    setLoadType(type) {
        console.log(`Selecionando carga: ${type}`);
        this.currentLoadType = type;
        
        // Atualizar UI
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const currentBtn = document.querySelector(`.load-btn[data-load="${type}"]`);
        if (currentBtn) {
            currentBtn.classList.add('active');
        }
        
        // Mostrar/ocultar propriedades
        const distProps = document.getElementById('distributed-props');
        if (distProps) {
            distProps.classList.toggle('hidden', type !== 'distributed');
        }
    }

    getToolName(tool) {
        const names = {
            'select': 'Selecionar',
            'node': 'Nó',
            'beam': 'Barra',
            'delete': 'Excluir',
            'support': 'Vínculo',
            'load': 'Carga',
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
        if (this.app.currentStructure) {
            const dataStr = JSON.stringify(this.app.currentStructure, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', `estrutura_${new Date().getTime()}.json`);
            linkElement.click();
            
            this.showToast('Estrutura exportada como JSON!', 'success');
        } else {
            this.showToast('Nenhuma estrutura para exportar.', 'error');
        }
    }

    toggleFullscreen() {
        const elem = document.documentElement;
        
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    showToast(message, type = 'info') {
        console.log(`Toast [${type}]: ${message}`);
        
        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(toast);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Controles da interface do usuário
class UIControls {
    constructor(app) {
        this.app = app;
        this.currentTool = 'select';
        this.currentLoadType = 'point';
        this.currentSupportType = 'pinned';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Ferramentas - Verificar se os elementos existem antes de adicionar listeners
        const toolButtons = document.querySelectorAll('.tool-btn');
        if (toolButtons.length > 0) {
            toolButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.setTool(btn.dataset.tool);
                });
            });
        }

        // Vínculos
        const supportButtons = document.querySelectorAll('.support-btn');
        if (supportButtons.length > 0) {
            supportButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.setSupportType(btn.dataset.support);
                });
            });
        }

        // Cargas
        const loadButtons = document.querySelectorAll('.load-btn');
        if (loadButtons.length > 0) {
            loadButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.setLoadType(btn.dataset.load);
                });
            });
        }

        // Propriedades de carga - Verificar se os elementos existem
        const loadMagnitude = document.getElementById('load-magnitude');
        const loadDirection = document.getElementById('load-direction');
        
        if (loadMagnitude) {
            loadMagnitude.addEventListener('change', (e) => {
                this.updateLoadProperties();
            });
        }
        
        if (loadDirection) {
            loadDirection.addEventListener('change', (e) => {
                this.updateLoadProperties();
            });
        }

        // Zoom e navegação
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const panViewBtn = document.getElementById('pan-view');
        const fitViewBtn = document.getElementById('fit-view');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        if (panViewBtn) panViewBtn.addEventListener('click', () => this.setTool('pan'));
        if (fitViewBtn) fitViewBtn.addEventListener('click', () => this.fitToView());

        // Configurações
        const gridSnap = document.getElementById('grid-snap');
        const showCoordinates = document.getElementById('show-coordinates');
        const scaleFactor = document.getElementById('scale-factor');
        
        if (gridSnap) {
            gridSnap.addEventListener('change', (e) => {
                if (this.app.renderer) {
                    this.app.renderer.gridSnap = e.target.checked;
                    this.app.renderer.render();
                }
            });
        }
        
        if (showCoordinates) {
            showCoordinates.addEventListener('change', (e) => {
                if (this.app.renderer) {
                    this.app.renderer.showCoordinates = e.target.checked;
                    this.app.renderer.render();
                }
            });
        }
        
        if (scaleFactor) {
            scaleFactor.addEventListener('input', (e) => {
                const value = e.target.value;
                const scaleValue = document.getElementById('scale-value');
                if (scaleValue) {
                    scaleValue.textContent = `1:${value}`;
                }
                if (this.app.renderer) {
                    this.app.renderer.scale = value / 100;
                    this.app.renderer.render();
                }
            });
        }

        // Menu principal
        const helpBtn = document.getElementById('btn-help');
        const settingsBtn = document.getElementById('btn-settings');
        const fullscreenBtn = document.getElementById('btn-fullscreen');
        const exportBtn = document.getElementById('btn-export');
        const backToMenuBtn = document.getElementById('back-to-menu');
        
        if (helpBtn) helpBtn.addEventListener('click', () => this.showHelp());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportStructure());
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => this.showWelcomeScreen());
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Atualizar UI - Verificar se o elemento existe
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const toolElement = document.getElementById(`tool-${tool}`);
        if (toolElement) {
            toolElement.classList.add('active');
        }

        // Atualizar cursor
        const canvas = document.getElementById('structure-canvas');
        if (canvas) {
            switch(tool) {
                case 'select':
                    canvas.style.cursor = 'default';
                    break;
                case 'node':
                    canvas.style.cursor = 'crosshair';
                    break;
                case 'beam':
                    canvas.style.cursor = 'crosshair';
                    break;
                case 'delete':
                    canvas.style.cursor = 'not-allowed';
                    break;
                case 'pan':
                    canvas.style.cursor = 'grab';
                    break;
            }
        }

        if (this.app && this.app.updateStatusMessage) {
            this.app.updateStatusMessage(`Ferramenta: ${this.getToolName(tool)}`);
        }
    }

    setSupportType(type) {
        this.currentSupportType = type;
        this.currentTool = 'support';
        this.setTool('select'); // Para mostrar cursor correto
        
        if (this.app && this.app.updateStatusMessage) {
            this.app.updateStatusMessage(`Vínculo selecionado: ${this.getSupportName(type)}`);
        }
    }

    setLoadType(type) {
        this.currentLoadType = type;
        this.currentTool = 'load';
        this.setTool('select'); // Para mostrar cursor correto

        // Mostrar/ocultar propriedades específicas
        const distProps = document.getElementById('distributed-props');
        if (distProps) {
            if (type === 'distributed') {
                distProps.classList.remove('hidden');
            } else {
                distProps.classList.add('hidden');
            }
        }

        if (this.app && this.app.updateStatusMessage) {
            this.app.updateStatusMessage(`Carga selecionada: ${this.getLoadName(type)}`);
        }
    }

    updateLoadProperties() {
        const magnitudeInput = document.getElementById('load-magnitude');
        const directionInput = document.getElementById('load-direction');
        
        if (!magnitudeInput || !directionInput) return;
        
        const magnitude = parseFloat(magnitudeInput.value);
        const direction = parseFloat(directionInput.value);
        
        // Validar valores
        if (isNaN(magnitude) || magnitude <= 0) {
            magnitudeInput.classList.add('error');
            return;
        } else {
            magnitudeInput.classList.remove('error');
        }

        if (isNaN(direction) || direction < 0 || direction > 360) {
            directionInput.classList.add('error');
            return;
        } else {
            directionInput.classList.remove('error');
        }
    }

    getToolName(tool) {
        const names = {
            'select': 'Selecionar',
            'node': 'Nó',
            'beam': 'Barra',
            'delete': 'Excluir',
            'pan': 'Mover Vista',
            'support': 'Vínculo',
            'load': 'Carga'
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

    showHelp() {
        console.log('Mostrando ajuda');
        // Implementar modal de ajuda
    }

    showSettings() {
        console.log('Mostrando configurações');
        // Implementar modal de configurações
    }

    zoomIn() {
        if (this.app && this.app.renderer) {
            this.app.renderer.zoomIn();
        }
    }

    zoomOut() {
        if (this.app && this.app.renderer) {
            this.app.renderer.zoomOut();
        }
    }

    fitToView() {
        if (this.app && this.app.renderer) {
            this.app.renderer.fitToView();
        }
    }

    toggleFullscreen() {
        const elem = document.documentElement;
        
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    }

    exportStructure() {
        if (!this.app || !this.app.currentStructure) {
            alert('Não há estrutura para exportar.');
            return;
        }

        // Criar objeto com dados da estrutura
        const exportData = {
            type: this.app.structureType,
            structure: this.app.currentStructure,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        // Converter para JSON
        const json = JSON.stringify(exportData, null, 2);
        
        // Criar blob e link de download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estrutura_${this.app.structureType}_${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (this.app && this.app.updateStatusMessage) {
            this.app.updateStatusMessage('Estrutura exportada com sucesso');
        }
    }

    showWelcomeScreen() {
        if (confirm('Deseja voltar ao menu principal? Todo o progresso atual será perdido.')) {
            const welcomeScreen = document.getElementById('welcome-screen');
            const mainInterface = document.getElementById('main-interface');
            
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');
            if (mainInterface) mainInterface.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // Implementar toast mais tarde
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
}

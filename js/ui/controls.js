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
        // Ferramentas
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTool(btn.dataset.tool);
            });
        });

        // Vínculos
        document.querySelectorAll('.support-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSupportType(btn.dataset.support);
            });
        });

        // Cargas
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setLoadType(btn.dataset.load);
            });
        });

        // Propriedades de carga
        document.getElementById('load-magnitude').addEventListener('change', (e) => {
            this.updateLoadProperties();
        });

        document.getElementById('load-direction').addEventListener('change', (e) => {
            this.updateLoadProperties();
        });

        // Zoom e navegação
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.app.renderer.zoomIn();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.app.renderer.zoomOut();
        });

        document.getElementById('pan-view').addEventListener('click', () => {
            this.setTool('pan');
        });

        document.getElementById('fit-view').addEventListener('click', () => {
            this.app.renderer.fitToView();
        });

        // Configurações
        document.getElementById('grid-snap').addEventListener('change', (e) => {
            this.app.renderer.gridSnap = e.target.checked;
            this.app.renderer.render();
        });

        document.getElementById('show-coordinates').addEventListener('change', (e) => {
            this.app.renderer.showCoordinates = e.target.checked;
            this.app.renderer.render();
        });

        document.getElementById('scale-factor').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('scale-value').textContent = `1:${value}`;
            this.app.renderer.scale = value / 100;
            this.app.renderer.render();
        });

        // Menu principal
        document.getElementById('btn-help').addEventListener('click', () => {
            this.showHelp();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            this.exportStructure();
        });

        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showWelcomeScreen();
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Atualizar UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`tool-${tool}`).classList.add('active');

        // Atualizar cursor
        const canvas = document.getElementById('structure-canvas');
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

        this.app.updateStatusMessage(`Ferramenta: ${this.getToolName(tool)}`);
    }

    setSupportType(type) {
        this.currentSupportType = type;
        this.currentTool = 'support';
        this.setTool('select'); // Para mostrar cursor correto
        
        this.app.updateStatusMessage(`Vínculo selecionado: ${this.getSupportName(type)}`);
    }

    setLoadType(type) {
        this.currentLoadType = type;
        this.currentTool = 'load';
        this.setTool('select'); // Para mostrar cursor correto

        // Mostrar/ocultar propriedades específicas
        const distProps = document.getElementById('distributed-props');
        if (type === 'distributed') {
            distProps.classList.remove('hidden');
        } else {
            distProps.classList.add('hidden');
        }

        this.app.updateStatusMessage(`Carga selecionada: ${this.getLoadName(type)}`);
    }

    updateLoadProperties() {
        const magnitude = parseFloat(document.getElementById('load-magnitude').value);
        const direction = parseFloat(document.getElementById('load-direction').value);
        
        // Validar valores
        if (isNaN(magnitude) || magnitude <= 0) {
            document.getElementById('load-magnitude').classList.add('error');
            return;
        } else {
            document.getElementById('load-magnitude').classList.remove('error');
        }

        if (isNaN(direction) || direction < 0 || direction > 360) {
            document.getElementById('load-direction').classList.add('error');
            return;
        } else {
            document.getElementById('load-direction').classList.remove('error');
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
        const modal = document.getElementById('help-modal');
        if (!modal) {
            this.createHelpModal();
        } else {
            modal.classList.remove('hidden');
        }
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-question-circle"></i> Ajuda</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="help-content">
                        <h4>Como usar o Isostática Lab</h4>
                        <ol>
                            <li><strong>Selecione o tipo de estrutura</strong> na tela inicial</li>
                            <li><strong>Adicione nós</strong> clicando na área de desenho</li>
                            <li><strong>Conecte os nós com barras</strong></li>
                            <li><strong>Adicione vínculos</strong> (apoios) nos nós</li>
                            <li><strong>Aplique cargas</strong> (pontuais, distribuídas, momentos)</li>
                            <li><strong>Clique em "Calcular"</strong> para analisar</li>
                            <li><strong>Visualize os diagramas</strong> usando os toggles</li>
                        </ol>
                        
                        <h4>Atalhos do Teclado</h4>
                        <ul>
                            <li><kbd>N</kbd> - Ferramenta Nó</li>
                            <li><kbd>B</kbd> - Ferramenta Barra</li>
                            <li><kbd>Delete</kbd> - Excluir elemento selecionado</li>
                            <li><kbd>Ctrl + +</kbd> - Zoom In</li>
                            <li><kbd>Ctrl + -</kbd> - Zoom Out</li>
                            <li><kbd>Espaço</kbd> - Mover vista</li>
                            <li><kbd>F</kbd> - Ajustar à tela</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary close-help">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal.querySelector('.close-help').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    showSettings() {
        const modal = document.getElementById('settings-modal');
        if (!modal) {
            this.createSettingsModal();
        } else {
            modal.classList.remove('hidden');
        }
    }

    createSettingsModal() {
        const modal = document.getElementById('settings-modal');
        
        // Adicionar conteúdo às configurações
        const body = modal.querySelector('.modal-body');
        body.innerHTML = `
            <div class="settings-section">
                <h4>Configurações de Visualização</h4>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-show-grid" checked>
                            Mostrar grade
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-show-labels" checked>
                            Mostrar rótulos
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-show-values" checked>
                            Mostrar valores
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Configurações de Cálculo</h4>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Tolerância de cálculo:</label>
                        <input type="number" id="setting-tolerance" value="0.001" step="0.001" min="0.0001">
                    </div>
                    <div class="setting-item">
                        <label>Unidades padrão:</label>
                        <select id="setting-units">
                            <option value="kN">kN</option>
                            <option value="N">N</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Configurações de Interface</h4>
                <div class="settings-grid">
                    <div class="setting-item">
                        <label>Tema:</label>
                        <select id="setting-theme">
                            <option value="light">Claro</option>
                            <option value="dark">Escuro</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Tamanho da fonte:</label>
                        <input type="range" id="setting-font-size" min="12" max="18" value="14">
                    </div>
                </div>
            </div>
        `;
        
        // Configurar eventos
        document.getElementById('setting-show-grid').addEventListener('change', (e) => {
            this.app.renderer.showGrid = e.target.checked;
            this.app.renderer.render();
        });
        
        document.getElementById('setting-show-labels').addEventListener('change', (e) => {
            this.app.renderer.showLabels = e.target.checked;
            this.app.renderer.render();
        });
        
        document.getElementById('setting-show-values').addEventListener('change', (e) => {
            this.app.renderer.showValues = e.target.checked;
            this.app.renderer.render();
        });
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
        if (!this.app.currentStructure) {
            alert('Não há estrutura para exportar.');
            return;
        }

        // Criar objeto com dados da estrutura
        const exportData = {
            type: this.app.structureType,
            structure: this.app.currentStructure,
            results: this.app.currentStructure.results,
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
        
        this.app.updateStatusMessage('Estrutura exportada com sucesso');
    }

    showWelcomeScreen() {
        if (confirm('Deseja voltar ao menu principal? Todo o progresso atual será perdido.')) {
            document.getElementById('welcome-screen').classList.remove('hidden');
            document.getElementById('main-interface').style.display = 'none';
        }
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

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.remove();
        }, 3000);
        
        // Fechar ao clicar
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }
}

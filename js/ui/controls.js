// Controles da interface do usuário

class UIControls {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.setupControlListeners();
        this.updateUI();
    }

    setupControlListeners() {
        // Controle de zoom
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.app.renderer.zoomIn();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            this.app.renderer.zoomOut();
        });

        document.getElementById('fit-view').addEventListener('click', () => {
            this.app.renderer.fitToView();
        });

        // Controle de snap to grid
        const gridSnap = document.getElementById('grid-snap');
        gridSnap.addEventListener('change', (e) => {
            this.app.gridSnapEnabled = e.target.checked;
        });

        // Mostrar coordenadas
        const showCoords = document.getElementById('show-coordinates');
        showCoords.addEventListener('change', (e) => {
            const display = document.getElementById('coordinate-display');
            if (e.target.checked) {
                display.classList.remove('hidden');
            } else {
                display.classList.add('hidden');
            }
        });

        // Escala
        const scaleSlider = document.getElementById('scale-factor');
        const scaleValue = document.getElementById('scale-value');
        
        scaleSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            scaleValue.textContent = `1:${value}`;
            // Atualizar escala de renderização se necessário
        });

        // Controle de cargas
        const loadTypeButtons = document.querySelectorAll('.load-btn');
        loadTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const loadType = btn.dataset.load;
                this.app.currentTool = 'load';
                this.app.selectedLoadType = loadType;
                
                // Mostrar/ocultar propriedades específicas
                const distProps = document.getElementById('distributed-props');
                if (loadType === 'distributed') {
                    distProps.classList.remove('hidden');
                } else {
                    distProps.classList.add('hidden');
                }
                
                this.updateUI();
            });
        });

        // Controle de vínculos
        const supportButtons = document.querySelectorAll('.support-btn');
        supportButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.currentTool = 'support';
                this.app.selectedSupportType = btn.dataset.support;
                this.updateUI();
            });
        });

        // Botão de ajuda
        document.getElementById('btn-help').addEventListener('click', () => {
            this.showHelp();
        });

        // Botão de configurações
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showSettings();
        });

        // Botão de tela cheia
        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Botão de exportar
        document.getElementById('btn-export').addEventListener('click', () => {
            this.exportStructure();
        });
    }

    updateUI() {
        // Atualizar estado das ferramentas
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeToolBtn = document.getElementById(`tool-${this.app.currentTool}`);
        if (activeToolBtn) {
            activeToolBtn.classList.add('active');
        }

        // Atualizar status da estrutura
        this.updateStructureStatus();
    }

    updateStructureStatus() {
        if (!this.app.currentStructure) return;
        
        const nodeCount = this.app.currentStructure.nodes.length;
        const beamCount = this.app.currentStructure.beams.length;
        
        document.getElementById('node-count').textContent = nodeCount;
        document.getElementById('bar-count').textContent = beamCount;
        
        // Calcular grau de estaticidade
        const degree = this.app.calculator.calculateStaticDegree(this.app.currentStructure);
        document.getElementById('static-degree').textContent = degree;
        
        // Atualizar indicador
        const indicator = document.getElementById('isostatic-indicator');
        let status, className;
        
        if (degree === 0) {
            status = 'ISOSTÁTICA';
            className = 'isostatic';
        } else if (degree > 0) {
            status = 'HIPOSTÁTICA';
            className = 'hypostatic';
        } else {
            status = 'HIPERESTÁTICA';
            className = 'hyperstatic';
        }
        
        indicator.textContent = status;
        indicator.className = `status-badge ${className}`;
    }

    showHelp() {
        alert('Isostática Lab - Ajuda\n\n' +
              '1. Selecione uma ferramenta no painel esquerdo\n' +
              '2. Clique na área de desenho para adicionar elementos\n' +
              '3. Conecte nós com barras\n' +
              '4. Adicione vínculos e cargas\n' +
              '5. Clique em "Calcular" para analisar a estrutura\n' +
              '6. Use as opções de visualização para mostrar diagramas\n\n' +
              'Para mais informações, consulte a aba "Aprendizado".');
    }

    showSettings() {
        alert('Configurações\n\nEm desenvolvimento...');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Erro ao entrar em tela cheia: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    exportStructure() {
        if (!this.app.currentStructure) {
            alert('Não há estrutura para exportar.');
            return;
        }

        const data = {
            type: this.app.structureType,
            nodes: this.app.currentStructure.nodes.map(node => ({
                id: node.id,
                x: node.x,
                y: node.y,
                support: node.support,
                loads: node.loads,
                moments: node.moments
            })),
            beams: this.app.currentStructure.beams.map(beam => ({
                id: beam.id,
                startId: beam.start.id,
                endId: beam.end.id,
                distributedLoads: beam.distributedLoads
            })),
            results: this.app.currentStructure.internalForces
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estrutura_${this.app.structureType}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Estrutura exportada com sucesso!');
    }
}

window.UIControls = UIControls;

// APP PRINCIPAL - Calculadora de Vigas
class BeamCalculatorApp {
    constructor() {
        this.state = {
            activeTool: 'select',
            beamLength: 10,
            scale: 50,
            units: 'kN',
            elements: [],
            selectedElement: null,
            calculations: null
        };
        
        // Inicializar módulos
        this.initModules();
        this.initEventListeners();
        this.initCanvas();
        this.initCharts();
        this.drawGrid();
        this.drawBeam();
    }
    
    initModules() {
        this.canvasManager = new CanvasManager('main-canvas', this);
        this.beamSolver = new BeamSolver();
        this.toolbox = new Toolbox(this);
        this.propertiesPanel = new PropertiesPanel(this);
    }
    
    initEventListeners() {
        // Comprimento da viga
        document.getElementById('update-beam').addEventListener('click', () => {
            this.state.beamLength = parseFloat(document.getElementById('beam-length').value);
            this.drawBeam();
        });
        
        // Escala
        document.getElementById('scale-slider').addEventListener('input', (e) => {
            this.state.scale = parseInt(e.target.value);
            document.getElementById('scale-value').textContent = this.state.scale;
            this.drawGrid();
            this.drawBeam();
        });
        
        // Unidades
        document.getElementById('unit-select').addEventListener('change', (e) => {
            this.state.units = e.target.value;
        });
        
        // Calcular
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculateResults();
        });
        
        // Limpar tudo
        document.getElementById('clear-all').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todos os elementos?')) {
                this.clearAll();
            }
        });
        
        // Abas dos diagramas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchDiagramTab(tab);
            });
        });
        
        // Modal de ajuda
        document.getElementById('show-help').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideHelp();
        });
        
        // Fechar modal clicando fora
        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                this.hideHelp();
            }
        });
        
        // Exportar PNG
        document.getElementById('export-png').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportToPNG();
        });
        
        // Coordenadas do mouse
        const canvas = document.getElementById('main-canvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.state.scale;
            const y = (rect.bottom - e.clientY) / this.state.scale;
            document.getElementById('coords').textContent = `X: ${x.toFixed(2)}m, Y: ${y.toFixed(2)}m`;
        });
    }
    
    initCanvas() {
        const canvas = document.getElementById('main-canvas');
        this.fabricCanvas = new fabric.Canvas(canvas, {
            selection: true,
            preserveObjectStacking: true
        });
        
        // Eventos do canvas
        this.fabricCanvas.on('selection:created', (e) => {
            this.state.selectedElement = e.selected[0];
            this.propertiesPanel.update(this.state.selectedElement);
        });
        
        this.fabricCanvas.on('selection:cleared', () => {
            this.state.selectedElement = null;
            this.propertiesPanel.clear();
        });
    }
    
    initCharts() {
        // Gráfico do cortante
        this.shearChart = new Chart(document.getElementById('shear-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cortante (V)',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Diagrama de Força Cortante'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Posição (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Força Cortante (kN)'
                        }
                    }
                }
            }
        });
        
        // Gráfico do momento
        this.momentChart = new Chart(document.getElementById('moment-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Momento (M)',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Diagrama de Momento Fletor'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Posição (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Momento (kN.m)'
                        }
                    }
                }
            }
        });
        
        // Gráfico do normal
        this.normalChart = new Chart(document.getElementById('normal-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Normal (N)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Diagrama de Força Normal'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Posição (m)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Força Normal (kN)'
                        }
                    }
                }
            }
        });
    }
    
    drawGrid() {
        this.fabricCanvas.clear();
        
        const width = this.fabricCanvas.width;
        const height = this.fabricCanvas.height;
        const gridSize = this.state.scale;
        
        // Desenhar grid
        for (let x = 0; x <= width; x += gridSize) {
            const line = new fabric.Line([x, 0, x, height], {
                stroke: '#e0e0e0',
                strokeWidth: 1,
                selectable: false
            });
            this.fabricCanvas.add(line);
        }
        
        for (let y = 0; y <= height; y += gridSize) {
            const line = new fabric.Line([0, y, width, y], {
                stroke: '#e0e0e0',
                strokeWidth: 1,
                selectable: false
            });
            this.fabricCanvas.add(line);
        }
    }
    
    drawBeam() {
        const beamY = this.fabricCanvas.height / 2;
        const beamLengthPx = this.state.beamLength * this.state.scale;
        
        // Linha da viga
        const beamLine = new fabric.Line([0, beamY, beamLengthPx, beamY], {
            stroke: '#2c3e50',
            strokeWidth: 4,
            selectable: false,
            strokeLineCap: 'round'
        });
        
        // Marcações de metros
        for (let i = 0; i <= this.state.beamLength; i++) {
            const x = i * this.state.scale;
            
            // Marcação
            const tick = new fabric.Line([x, beamY - 10, x, beamY + 10], {
                stroke: '#2c3e50',
                strokeWidth: 2,
                selectable: false
            });
            
            // Texto
            const text = new fabric.Text(`${i}m`, {
                left: x - 10,
                top: beamY + 15,
                fontSize: 12,
                fill: '#2c3e50',
                selectable: false
            });
            
            this.fabricCanvas.add(tick);
            this.fabricCanvas.add(text);
        }
        
        this.fabricCanvas.add(beamLine);
        this.fabricCanvas.sendToBack(beamLine);
    }
    
    setActiveTool(tool) {
        this.state.activeTool = tool;
        this.fabricCanvas.selection = (tool === 'select');
        
        // Atualizar botões ativos
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }
    
    calculateResults() {
        // Coletar elementos da viga
        const elements = this.collectElements();
        
        // Mostrar loading
        document.getElementById('loading-results').style.display = 'flex';
        document.getElementById('reactions-output').innerHTML = '';
        
        // Simular cálculo (em produção seria instantâneo)
        setTimeout(() => {
            try {
                // Calcular reações
                this.state.calculations = this.beamSolver.calculate(elements);
                
                // Mostrar resultados
                this.displayResults();
                
                // Calcular e mostrar diagramas
                this.calculateDiagrams();
                
                // Esconder loading
                document.getElementById('loading-results').style.display = 'none';
            } catch (error) {
                document.getElementById('loading-results').innerHTML = 
                    `<span style="color: var(--danger);">
                        <i class="fas fa-exclamation-triangle"></i> Erro: ${error.message}
                    </span>`;
            }
        }, 500);
    }
    
    collectElements() {
        const elements = [];
        const fabricObjects = this.fabricCanvas.getObjects();
        
        fabricObjects.forEach(obj => {
            if (obj.elementType) {
                elements.push({
                    type: obj.elementType,
                    position: obj.position || (obj.left / this.state.scale),
                    value: obj.value || 0,
                    length: obj.length || 0,
                    direction: obj.direction || 'down'
                });
            }
        });
        
        return {
            length: this.state.beamLength,
            elements: elements,
            units: this.state.units
        };
    }
    
    displayResults() {
        const results = this.state.calculations;
        let html = '';
        
        if (results.reactions && results.reactions.length > 0) {
            results.reactions.forEach((reaction, index) => {
                html += `
                    <div class="reaction-item">
                        <span>Reação R${index + 1}:</span>
                        <span class="reaction-value">${reaction.value.toFixed(2)} ${this.state.units}</span>
                    </div>
                `;
            });
            
            html += `
                <div class="reaction-item">
                    <span>ΣFy:</span>
                    <span class="reaction-value" style="color: ${Math.abs(results.sumForces) < 0.01 ? 'green' : 'red'}">
                        ${results.sumForces.toFixed(3)} ${this.state.units}
                    </span>
                </div>
                <div class="reaction-item">
                    <span>ΣM:</span>
                    <span class="reaction-value" style="color: ${Math.abs(results.sumMoments) < 0.01 ? 'green' : 'red'}">
                        ${results.sumMoments.toFixed(3)} ${this.state.units}.m
                    </span>
                </div>
            `;
        } else {
            html = '<p>Não foi possível calcular as reações. Verifique a configuração da viga.</p>';
        }
        
        document.getElementById('reactions-output').innerHTML = html;
    }
    
    calculateDiagrams() {
        if (!this.state.calculations) return;
        
        const points = 100;
        const dx = this.state.beamLength / points;
        const positions = [];
        const shearValues = [];
        const momentValues = [];
        const normalValues = [];
        
        // Gerar pontos para os diagramas
        for (let i = 0; i <= points; i++) {
            const x = i * dx;
            positions.push(x.toFixed(1));
            
            // Valores de exemplo (substituir por cálculo real)
            shearValues.push(Math.sin(x) * 10);
            momentValues.push(Math.cos(x) * 20);
            normalValues.push(0); // Para vigas simples, normal é zero
        }
        
        // Atualizar gráficos
        this.updateChart(this.shearChart, positions, shearValues, 'Cortante');
        this.updateChart(this.momentChart, positions, momentValues, 'Momento');
        this.updateChart(this.normalChart, positions, normalValues, 'Normal');
        
        // Mostrar valores máximos
        this.showMaxValues(shearValues, momentValues);
    }
    
    updateChart(chart, labels, data, type) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = `${type} (${this.state.units}${type === 'Momento' ? '.m' : ''})`;
        chart.update();
    }
    
    showMaxValues(shearValues, momentValues) {
        const maxShear = Math.max(...shearValues);
        const minShear = Math.min(...shearValues);
        const maxMoment = Math.max(...momentValues);
        const minMoment = Math.min(...momentValues);
        
        const html = `
            <div class="max-value-item">
                <span>Cortante máximo:</span>
                <span style="color: var(--danger);">${maxShear.toFixed(2)} ${this.state.units}</span>
            </div>
            <div class="max-value-item">
                <span>Cortante mínimo:</span>
                <span style="color: var(--primary);">${minShear.toFixed(2)} ${this.state.units}</span>
            </div>
            <div class="max-value-item">
                <span>Momento máximo:</span>
                <span style="color: var(--secondary);">${maxMoment.toFixed(2)} ${this.state.units}.m</span>
            </div>
            <div class="max-value-item">
                <span>Momento mínimo:</span>
                <span style="color: var(--warning);">${minMoment.toFixed(2)} ${this.state.units}.m</span>
            </div>
        `;
        
        document.getElementById('max-values').innerHTML = html;
    }
    
    switchDiagramTab(tab) {
        // Atualizar botões
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Mostrar gráfico correspondente
        const charts = ['shear-chart', 'moment-chart', 'normal-chart'];
        charts.forEach(chartId => {
            document.getElementById(chartId).style.display = 'none';
        });
        
        document.getElementById(`${tab}-chart`).style.display = 'block';
    }
    
    clearAll() {
        // Limpar canvas
        this.fabricCanvas.clear();
        
        // Limpar resultados
        document.getElementById('reactions-output').innerHTML = '';
        document.getElementById('max-values').innerHTML = '<p>Valores máximos aparecerão aqui após cálculo.</p>';
        
        // Resetar gráficos
        this.updateChart(this.shearChart, [], [], 'Cortante');
        this.updateChart(this.momentChart, [], [], 'Momento');
        this.updateChart(this.normalChart, [], [], 'Normal');
        
        // Redesenhar grid e viga
        this.drawGrid();
        this.drawBeam();
        
        // Resetar estado
        this.state.elements = [];
        this.state.selectedElement = null;
        this.state.calculations = null;
    }
    
    showHelp() {
        document.getElementById('help-modal').style.display = 'flex';
    }
    
    hideHelp() {
        document.getElementById('help-modal').style.display = 'none';
    }
    
    exportToPNG() {
        const link = document.createElement('a');
        link.download = 'viga-diagramas.png';
        link.href = document.getElementById('main-canvas').toDataURL();
        link.click();
    }
}

// Inicializar app quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BeamCalculatorApp();
});
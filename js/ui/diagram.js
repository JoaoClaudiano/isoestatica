// Gerenciamento de diagramas
class DiagramManager {
    constructor(renderer, app) {
        this.renderer = renderer;
        this.app = app;
        this.diagramScale = 0.2;
        this.diagramOpacity = 0.7;
        this.showValues = true;
        this.hoverInfo = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDiagramControls();
    }

    setupEventListeners() {
        // Hover no canvas para mostrar valores
        const canvas = document.getElementById('structure-canvas');
        canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        canvas.addEventListener('mouseleave', () => this.clearHoverInfo());
    }

    setupDiagramControls() {
        // Toggles de diagramas
        const toggles = ['N', 'V', 'M', 'T'];
        toggles.forEach(toggle => {
            const element = document.getElementById(`toggle-${toggle}`);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.toggleDiagram(toggle, e.target.checked);
                });
            }
        });

        // Controle de deformada
        const deformedToggle = document.getElementById('toggle-deformed');
        if (deformedToggle) {
            deformedToggle.addEventListener('change', (e) => {
                this.renderer.showDeformed = e.target.checked;
                this.renderer.render();
            });
        }
    }

    toggleDiagram(type, visible) {
        switch(type) {
            case 'N':
                this.renderer.showNormal = visible;
                break;
            case 'V':
                this.renderer.showShear = visible;
                break;
            case 'M':
                this.renderer.showMoment = visible;
                break;
            case 'T':
                this.renderer.showTorsion = visible;
                break;
        }
        this.renderer.render();
    }

    handleCanvasHover(e) {
        if (!this.app.currentStructure || !this.app.currentStructure.results) {
            return;
        }

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldPos = this.renderer.screenToWorld(x, y);

        // Encontrar barra mais próxima
        let closestBeam = null;
        let closestDistance = Infinity;
        let closestT = 0;

        this.app.currentStructure.beams.forEach(beam => {
            const distance = this.distanceToBeam(worldPos.x, worldPos.y, beam);
            if (distance < closestDistance && distance < 0.5) {
                closestDistance = distance;
                closestBeam = beam;
                closestT = this.getBeamParameter(worldPos.x, worldPos.y, beam);
            }
        });

        if (closestBeam && this.app.currentStructure.results.internalForces) {
            const forces = this.app.currentStructure.results.internalForces.beams[closestBeam.id];
            if (forces) {
                this.showHoverInfo(e.clientX, e.clientY, closestBeam, closestT, forces);
            }
        } else {
            this.clearHoverInfo();
        }
    }

    distanceToBeam(x, y, beam) {
        const start = { x: beam.start.x, y: beam.start.y };
        const end = { x: beam.end.x, y: beam.end.y };
        
        const A = x - start.x;
        const B = y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getBeamParameter(x, y, beam) {
        const start = { x: beam.start.x, y: beam.start.y };
        const end = { x: beam.end.x, y: beam.end.y };
        
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return 0;
        
        const vx = x - start.x;
        const vy = y - start.y;
        
        // Projeção do vetor v na direção da barra
        const t = (vx * dx + vy * dy) / (length * length);
        
        return Math.max(0, Math.min(1, t));
    }

    showHoverInfo(x, y, beam, t, forces) {
        // Calcular valores interpolados
        const normal = this.interpolateForce(forces.normal, t);
        const shear = this.interpolateForce(forces.shear, t);
        const moment = this.interpolateForce(forces.moment, t);
        const torsion = forces.torsion ? this.interpolateForce(forces.torsion, t) : 0;

        // Criar ou atualizar tooltip
        let tooltip = document.getElementById('hover-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'hover-tooltip';
            tooltip.className = 'hover-tooltip';
            document.body.appendChild(tooltip);
        }

        // Conteúdo do tooltip
        let content = `<div class="tooltip-header">Barra ${beam.id} (${(t * 100).toFixed(1)}%)</div>`;
        
        if (this.renderer.showNormal) {
            content += `<div class="tooltip-item">
                <span class="tooltip-label">Normal:</span>
                <span class="tooltip-value">${normal.toFixed(2)} kN</span>
            </div>`;
        }
        
        if (this.renderer.showShear) {
            content += `<div class="tooltip-item">
                <span class="tooltip-label">Cortante:</span>
                <span class="tooltip-value">${shear.toFixed(2)} kN</span>
            </div>`;
        }
        
        if (this.renderer.showMoment) {
            content += `<div class="tooltip-item">
                <span class="tooltip-label">Momento:</span>
                <span class="tooltip-value">${moment.toFixed(2)} kN.m</span>
            </div>`;
        }
        
        if (this.renderer.showTorsion && torsion !== 0) {
            content += `<div class="tooltip-item">
                <span class="tooltip-label">Torção:</span>
                <span class="tooltip-value">${torsion.toFixed(2)} kN.m</span>
            </div>`;
        }

        tooltip.innerHTML = content;
        
        // Posicionar tooltip
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y + 15}px`;
        tooltip.style.display = 'block';

        this.hoverInfo = { beam, t, normal, shear, moment, torsion };
    }

    interpolateForce(forceArray, t) {
        if (!forceArray || forceArray.length === 0) return 0;
        
        const n = forceArray.length;
        const index = t * (n - 1);
        const i1 = Math.floor(index);
        const i2 = Math.min(i1 + 1, n - 1);
        
        if (i1 === i2) return forceArray[i1].value;
        
        const t1 = forceArray[i1].x;
        const t2 = forceArray[i2].x;
        const v1 = forceArray[i1].value;
        const v2 = forceArray[i2].value;
        
        // Interpolação linear
        return v1 + (t - t1) * (v2 - v1) / (t2 - t1);
    }

    clearHoverInfo() {
        const tooltip = document.getElementById('hover-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        this.hoverInfo = null;
    }

    updateDiagramScale(scale) {
        this.diagramScale = scale;
        this.renderer.render();
    }

    updateDiagramOpacity(opacity) {
        this.diagramOpacity = opacity;
        this.renderer.render();
    }

    // Calcular valores extremos dos diagramas
    calculateExtremes(internalForces) {
        const extremes = {
            normal: { max: -Infinity, min: Infinity },
            shear: { max: -Infinity, min: Infinity },
            moment: { max: -Infinity, min: Infinity },
            torsion: { max: -Infinity, min: Infinity }
        };

        if (!internalForces || !internalForces.beams) return extremes;

        Object.values(internalForces.beams).forEach(beamForces => {
            ['normal', 'shear', 'moment', 'torsion'].forEach(type => {
                if (beamForces[type]) {
                    beamForces[type].forEach(point => {
                        extremes[type].max = Math.max(extremes[type].max, point.value);
                        extremes[type].min = Math.min(extremes[type].min, point.value);
                    });
                }
            });
        });

        return extremes;
    }

    // Atualizar UI com valores extremos
    updateExtremesUI(extremes) {
        const container = document.getElementById('extremes-container');
        if (!container) return;

        let html = '';
        
        ['normal', 'shear', 'moment', 'torsion'].forEach(type => {
            const extreme = extremes[type];
            if (extreme.max > -Infinity && extreme.min < Infinity) {
                html += `
                    <div class="extremes-group">
                        <strong>${this.getDiagramLabel(type)}:</strong>
                        <div>Máximo: ${extreme.max.toFixed(2)} ${this.getDiagramUnit(type)}</div>
                        <div>Mínimo: ${extreme.min.toFixed(2)} ${this.getDiagramUnit(type)}</div>
                    </div>
                `;
            }
        });

        if (html) {
            container.innerHTML = html;
        }
    }

    getDiagramLabel(type) {
        const labels = {
            normal: 'Normal (N)',
            shear: 'Cortante (V)',
            moment: 'Momento (M)',
            torsion: 'Torção (T)'
        };
        return labels[type] || type;
    }

    getDiagramUnit(type) {
        const units = {
            normal: 'kN',
            shear: 'kN',
            moment: 'kN.m',
            torsion: 'kN.m'
        };
        return units[type] || '';
    }

    // Exportar diagramas para imagem
    exportDiagrams() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Desenhar fundo
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar estrutura
        // ... (implementar renderização dos diagramas)
        
        // Converter para imagem e download
        const link = document.createElement('a');
        link.download = `diagramas_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

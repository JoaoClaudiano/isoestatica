// Renderizador de estruturas usando Canvas 2D
class StructureRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.structure = null;
        this.results = null;
        
        // Configurações de visualização
        this.scale = 100; // pixels por metro
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
        this.panX = 0;
        this.panY = 0;
        
        // Configurações de exibição
        this.showNormal = true;
        this.showShear = true;
        this.showMoment = true;
        this.showTorsion = false;
        this.showDeformed = false;
        this.deformationScale = 20;
        
        // Cores
        this.colors = {
            background: '#ffffff',
            grid: '#e0e0e0',
            axes: '#808080',
            structure: '#2c3e50',
            node: '#3498db',
            selected: '#e74c3c',
            support: '#27ae60',
            load: '#e74c3c',
            normal: '#3498db',
            shear: '#2ecc71',
            moment: '#e74c3c',
            torsion: '#9b59b6',
            deformed: '#f39c12',
            text: '#2c3e50'
        };
        
        // Inicializar
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }
    
    setStructure(structure) {
        this.structure = structure;
        this.fitToView();
    }
    
    setResults(reactions, internalForces) {
        this.results = { reactions, internalForces };
    }
    
    toggleDiagram(type, show) {
        switch(type) {
            case 'N': this.showNormal = show; break;
            case 'V': this.showShear = show; break;
            case 'M': this.showMoment = show; break;
            case 'T': this.showTorsion = show; break;
        }
        this.render();
    }
    
    toggleDeformedShape(show) {
        this.showDeformed = show;
        this.render();
    }
    
    zoomIn() {
        this.scale *= 1.2;
        this.render();
    }
    
    zoomOut() {
        this.scale /= 1.2;
        this.render();
    }
    
    fitToView() {
        if (!this.structure || this.structure.nodes.length === 0) {
            this.scale = 100;
            this.panX = 0;
            this.panY = 0;
            return;
        }
        
        const bounds = this.structure.getBounds();
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        
        // Calcular escala para caber na tela com margem
        const margin = 40; // pixels de margem
        const scaleX = (this.canvas.width - 2 * margin) / width;
        const scaleY = (this.canvas.height - 2 * margin) / height;
        this.scale = Math.min(scaleX, scaleY, 500); // Limitar zoom máximo
        
        // Centralizar
        this.panX = (this.canvas.width / 2) - this.scale * (bounds.minX + bounds.maxX) / 2;
        this.panY = (this.canvas.height / 2) + this.scale * (bounds.minY + bounds.maxY) / 2;
        
        this.render();
    }
    
    // Converter coordenadas
    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.panX,
            y: this.canvas.height - (y * this.scale + this.panY) // Inverter Y
        };
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.panX) / this.scale,
            y: (this.canvas.height - screenY - this.panY) / this.scale
        };
    }
    
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grade
        this.drawGrid();
        
        if (this.structure) {
            // Desenhar diagramas primeiro (para ficar atrás da estrutura)
            if (this.results && this.results.internalForces) {
                if (this.showNormal) this.drawNormalDiagram();
                if (this.showShear) this.drawShearDiagram();
                if (this.showMoment) this.drawMomentDiagram();
                if (this.showTorsion) this.drawTorsionDiagram();
            }
            
            // Desenhar estrutura
            this.drawStructure();
            
            // Desenhar forma deformada
            if (this.showDeformed && this.results) {
                this.drawDeformedShape();
            }
        }
        
        // Desenhar eixos
        this.drawAxes();
    }
    
    drawGrid() {
        const step = 1; // 1 metro
        const minorStep = 0.2; // 20 cm
        
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Linhas principais
        this.ctx.beginPath();
        for (let x = -100; x <= 100; x += step) {
            const screen = this.worldToScreen(x, 0);
            this.ctx.moveTo(screen.x, 0);
            this.ctx.lineTo(screen.x, this.canvas.height);
        }
        for (let y = -100; y <= 100; y += step) {
            const screen = this.worldToScreen(0, y);
            this.ctx.moveTo(0, screen.y);
            this.ctx.lineTo(this.canvas.width, screen.y);
        }
        this.ctx.stroke();
        
        // Linhas secundárias
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        for (let x = -100; x <= 100; x += minorStep) {
            const screen = this.worldToScreen(x, 0);
            this.ctx.moveTo(screen.x, 0);
            this.ctx.lineTo(screen.x, this.canvas.height);
        }
        for (let y = -100; y <= 100; y += minorStep) {
            const screen = this.worldToScreen(0, y);
            this.ctx.moveTo(0, screen.y);
            this.ctx.lineTo(this.canvas.width, screen.y);
        }
        this.ctx.stroke();
    }
    
    drawAxes() {
        // Origem
        const origin = this.worldToScreen(0, 0);
        
        // Eixo X
        this.ctx.strokeStyle = this.colors.axes;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, origin.y);
        this.ctx.lineTo(this.canvas.width, origin.y);
        this.ctx.stroke();
        
        // Eixo Y
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, 0);
        this.ctx.lineTo(origin.x, this.canvas.height);
        this.ctx.stroke();
        
        // Marcas e rótulos
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Marcas no eixo X
        for (let x = -10; x <= 10; x += 1) {
            if (x !== 0) {
                const screen = this.worldToScreen(x, 0);
                this.ctx.beginPath();
                this.ctx.moveTo(screen.x, origin.y - 5);
                this.ctx.lineTo(screen.x, origin.y + 5);
                this.ctx.stroke();
                
                this.ctx.fillText(`${x}m`, screen.x, origin.y + 8);
            }
        }
        
        // Marcas no eixo Y
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let y = -10; y <= 10; y += 1) {
            if (y !== 0) {
                const screen = this.worldToScreen(0, y);
                this.ctx.beginPath();
                this.ctx.moveTo(origin.x - 5, screen.y);
                this.ctx.lineTo(origin.x + 5, screen.y);
                this.ctx.stroke();
                
                this.ctx.fillText(`${y}m`, origin.x - 8, screen.y);
            }
        }
        
        // Rótulos dos eixos
        this.ctx.fillStyle = this.colors.axes;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('X', this.canvas.width - 10, origin.y - 10);
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Y', origin.x + 10, 10);
    }
    
    drawStructure() {
        if (!this.structure) return;
        
        // Desenhar barras
        this.ctx.strokeStyle = this.colors.structure;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        this.structure.beams.forEach(beam => {
            const start = this.worldToScreen(beam.start.x, beam.start.y);
            const end = this.worldToScreen(beam.end.x, beam.end.y);
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            // Rótulo da barra
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`B${beam.id}`, midX, midY);
        });
        
        // Desenhar nós
        this.structure.nodes.forEach(node => {
            const screen = this.worldToScreen(node.x, node.y);
            
            // Círculo do nó
            this.ctx.fillStyle = this.colors.node;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Contorno
            this.ctx.strokeStyle = this.colors.structure;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Rótulo do nó
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(`N${node.id}`, screen.x, screen.y - 8);
            
            // Coordenadas
            this.ctx.font = '9px Arial';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`(${node.x.toFixed(2)}, ${node.y.toFixed(2)})`, screen.x, screen.y + 8);
            
            // Desenhar vínculos
            if (node.support) {
                this.drawSupport(node, screen);
            }
            
            // Desenhar cargas
            if (node.loads.length > 0) {
                this.drawLoads(node, screen);
            }
            
            // Desenhar momentos
            if (node.moments.length > 0) {
                this.drawMoments(node, screen);
            }
        });
    }
    
    drawSupport(node, screenPos) {
        const { support } = node;
        
        this.ctx.save();
        this.ctx.translate(screenPos.x, screenPos.y);
        
        if (support.direction !== null) {
            this.ctx.rotate(support.direction);
        }
        
        this.ctx.strokeStyle = this.colors.support;
        this.ctx.fillStyle = this.colors.support;
        this.ctx.lineWidth = 2;
        
        switch(support.type) {
            case 'roller':
                // Apoio móvel
                this.ctx.beginPath();
                this.ctx.moveTo(-15, 0);
                this.ctx.lineTo(15, 0);
                this.ctx.lineTo(0, -20);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Roda
                this.ctx.beginPath();
                this.ctx.arc(0, 5, 8, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
                
            case 'pinned':
                // Apoio fixo
                this.ctx.beginPath();
                this.ctx.moveTo(-15, 0);
                this.ctx.lineTo(15, 0);
                this.ctx.lineTo(0, -20);
                this.ctx.closePath();
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.moveTo(-15, 0);
                this.ctx.lineTo(15, 0);
                this.ctx.stroke();
                break;
                
            case 'fixed':
                // Engaste
                this.ctx.fillRect(-15, -20, 30, 20);
                
                // Linhas diagonais
                this.ctx.strokeStyle = this.colors.structure;
                this.ctx.beginPath();
                for (let i = -10; i <= 10; i += 5) {
                    this.ctx.moveTo(i, -20);
                    this.ctx.lineTo(i * 0.5, 0);
                }
                this.ctx.stroke();
                break;
                
            case 'hinge':
                // Rótula
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(-6, 0);
                this.ctx.lineTo(6, 0);
                this.ctx.moveTo(0, -6);
                this.ctx.lineTo(0, 6);
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }
    
    drawLoads(node, screenPos) {
        node.loads.forEach(load => {
            this.ctx.save();
            this.ctx.translate(screenPos.x, screenPos.y);
            this.ctx.rotate(load.direction);
            
            this.ctx.strokeStyle = this.colors.load;
            this.ctx.fillStyle = this.colors.load;
            this.ctx.lineWidth = 2;
            
            // Seta da carga
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -30);
            this.ctx.stroke();
            
            // Ponta da seta
            this.ctx.beginPath();
            this.ctx.moveTo(0, -30);
            this.ctx.lineTo(-5, -20);
            this.ctx.lineTo(5, -20);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Valor
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(`${load.magnitude.toFixed(1)} kN`, 0, -35);
            
            this.ctx.restore();
        });
    }
    
    drawMoments(node, screenPos) {
        node.moments.forEach(moment => {
            this.ctx.save();
            this.ctx.translate(screenPos.x, screenPos.y);
            
            this.ctx.strokeStyle = this.colors.load;
            this.ctx.fillStyle = this.colors.load;
            this.ctx.lineWidth = 2;
            
            // Círculo do momento
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Seta circular
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 12, -Math.PI/4, Math.PI/4);
            this.ctx.stroke();
            
            // Ponta da seta
            this.ctx.save();
            this.ctx.translate(12 * Math.cos(Math.PI/4), 12 * Math.sin(Math.PI/4));
            this.ctx.rotate(Math.PI/4);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-4, -4);
            this.ctx.lineTo(4, -4);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
            
            // Valor
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${moment.magnitude.toFixed(1)} kN.m`, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    drawNormalDiagram() {
        if (!this.results || !this.results.internalForces.beams) return;
        
        this.ctx.strokeStyle = this.colors.normal;
        this.ctx.fillStyle = this.colors.normal;
        this.ctx.lineWidth = 2;
        
        Object.values(this.results.internalForces.beams).forEach(beamForces => {
            this.drawDiagramOnBeam(beamForces.normal, 1);
        });
    }
    
    drawShearDiagram() {
        if (!this.results || !this.results.internalForces.beams) return;
        
        this.ctx.strokeStyle = this.colors.shear;
        this.ctx.fillStyle = this.colors.shear;
        this.ctx.lineWidth = 2;
        
        Object.values(this.results.internalForces.beams).forEach(beamForces => {
            this.drawDiagramOnBeam(beamForces.shear, 1);
        });
    }
    
    drawMomentDiagram() {
        if (!this.results || !this.results.internalForces.beams) return;
        
        this.ctx.strokeStyle = this.colors.moment;
        this.ctx.fillStyle = this.colors.moment;
        this.ctx.lineWidth = 2;
        
        Object.values(this.results.internalForces.beams).forEach(beamForces => {
            this.drawDiagramOnBeam(beamForces.moment, -1); // Momento traciona fibras inferiores
        });
    }
    
    drawTorsionDiagram() {
        if (!this.results || !this.results.internalForces.beams) return;
        
        this.ctx.strokeStyle = this.colors.torsion;
        this.ctx.fillStyle = this.colors.torsion;
        this.ctx.lineWidth = 2;
        
        Object.values(this.results.internalForces.beams).forEach(beamForces => {
            if (beamForces.torsion) {
                this.drawDiagramOnBeam(beamForces.torsion, 1);
            }
        });
    }
    
    drawDiagramOnBeam(points, direction = 1) {
        // direction: 1 para acima da barra, -1 para abaixo
        
        if (!points || points.length < 2) return;
        
        const beam = this.structure.beams.find(b => 
            b.id === parseInt(Object.keys(this.results.internalForces.beams).find(key => 
                this.results.internalForces.beams[key] === points
            ))
        );
        
        if (!beam) return;
        
        // Fator de escala para o diagrama
        const scale = 0.1 * this.scale;
        
        this.ctx.beginPath();
        
        points.forEach((point, i) => {
            const t = point.x;
            const x = beam.start.x + t * (beam.end.x - beam.start.x);
            const y = beam.start.y + t * (beam.end.y - beam.start.y);
            
            // Calcular offset normal à barra
            const normalAngle = beam.angle + Math.PI / 2;
            const offset = point.value * scale * direction;
            
            const offsetX = offset * Math.cos(normalAngle);
            const offsetY = offset * Math.sin(normalAngle);
            
            const screen = this.worldToScreen(x + offsetX, y + offsetY);
            
            if (i === 0) {
                this.ctx.moveTo(screen.x, screen.y);
            } else {
                this.ctx.lineTo(screen.x, screen.y);
            }
        });
        
        this.ctx.stroke();
    }
    
    drawDeformedShape() {
        if (!this.results || !this.structure) return;
        
        this.ctx.strokeStyle = this.colors.deformed;
        this.ctx.fillStyle = this.colors.deformed;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.structure.beams.forEach(beam => {
            // Simplificado: apenas desenhar linha reta com deslocamento nos nós
            const startDeformed = this.worldToScreen(
                beam.start.x + beam.start.displacement.dx * this.deformationScale,
                beam.start.y + beam.start.displacement.dy * this.deformationScale
            );
            
            const endDeformed = this.worldToScreen(
                beam.end.x + beam.end.displacement.dx * this.deformationScale,
                beam.end.y + beam.end.displacement.dy * this.deformationScale
            );
            
            this.ctx.beginPath();
            this.ctx.moveTo(startDeformed.x, startDeformed.y);
            this.ctx.lineTo(endDeformed.x, endDeformed.y);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
        
        // Desenhar nós deformados
        this.structure.nodes.forEach(node => {
            const deformed = this.worldToScreen(
                node.x + node.displacement.dx * this.deformationScale,
                node.y + node.displacement.dy * this.deformationScale
            );
            
            this.ctx.beginPath();
            this.ctx.arc(deformed.x, deformed.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

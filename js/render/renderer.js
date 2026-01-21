// Renderizador básico
class StructureRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas com ID "${canvasId}" não encontrado!`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.structure = null;
        
        // Configurações
        this.scale = 100;
        this.panX = this.canvas.width / 2;
        this.panY = this.canvas.height / 2;
        
        // Inicializar
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.render();
        }
    }
    
    setStructure(structure) {
        this.structure = structure;
        this.fitToView();
    }
    
    fitToView() {
        if (!this.structure || this.structure.nodes.length === 0) {
            this.scale = 100;
            this.panX = this.canvas.width / 2;
            this.panY = this.canvas.height / 2;
            return;
        }
        
        // Calcular limites
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.structure.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        const margin = 50;
        
        const scaleX = (this.canvas.width - 2 * margin) / width;
        const scaleY = (this.canvas.height - 2 * margin) / height;
        this.scale = Math.min(scaleX, scaleY, 200);
        
        // Centralizar
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        this.panX = (this.canvas.width / 2) - (centerX * this.scale);
        this.panY = (this.canvas.height / 2) + (centerY * this.scale);
        
        this.render();
    }
    
    worldToScreen(x, y) {
        return {
            x: x * this.scale + this.panX,
            y: this.canvas.height - (y * this.scale + this.panY)
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
        
        // Desenhar estrutura
        if (this.structure) {
            this.drawStructure();
        }
        
        // Desenhar eixos
        this.drawAxes();
    }
    
    drawGrid() {
        const step = 1; // 1 metro
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = -100; x <= 100; x += step) {
            const screen = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screen.x, 0);
            ctx.lineTo(screen.x, this.canvas.height);
            ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = -100; y <= 100; y += step) {
            const screen = this.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screen.y);
            ctx.lineTo(this.canvas.width, screen.y);
            ctx.stroke();
        }
    }
    
    drawAxes() {
        const ctx = this.ctx;
        const origin = this.worldToScreen(0, 0);
        
        // Eixo X
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(this.canvas.width, origin.y);
        ctx.stroke();
        
        // Eixo Y
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, this.canvas.height);
        ctx.stroke();
    }
    
    drawStructure() {
        if (!this.structure) return;
        
        const ctx = this.ctx;
        
        // Desenhar barras
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        
        this.structure.beams.forEach(beam => {
            const start = this.worldToScreen(beam.start.x, beam.start.y);
            const end = this.worldToScreen(beam.end.x, beam.end.y);
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });
        
        // Desenhar nós
        this.structure.nodes.forEach(node => {
            const screen = this.worldToScreen(node.x, node.y);
            
            // Círculo do nó
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Contorno
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Rótulo
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`N${node.id}`, screen.x, screen.y - 8);
        });
    }
    
    zoomIn() {
        this.scale *= 1.2;
        this.render();
    }
    
    zoomOut() {
        this.scale /= 1.2;
        this.render();
    }
    
    toggleDiagram(type, show) {
        console.log(`Diagrama ${type}: ${show ? 'ligado' : 'desligado'}`);
    }
    
    toggleDeformedShape(show) {
        console.log(`Forma deformada: ${show ? 'ligada' : 'desligada'}`);
    }
}

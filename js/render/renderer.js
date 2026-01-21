// Renderizador CORRIGIDO - Aceita canvas ou ID
class StructureRenderer {
    constructor(canvas, ctx = null) {
        console.log('Inicializando StructureRenderer...');
        
        // Aceita tanto elemento canvas quanto ID string
        if (typeof canvas === 'string') {
            this.canvas = document.getElementById(canvas);
        } else {
            this.canvas = canvas;
        }
        
        if (!this.canvas) {
            console.error('❌ Canvas não encontrado no renderer!');
            // Tentar encontrar qualquer canvas
            this.canvas = document.querySelector('canvas');
            if (!this.canvas) {
                console.error('Nenhum canvas na página!');
                return;
            }
        }
        
        console.log('✅ Renderer: Canvas encontrado');
        
        // Usar contexto fornecido ou obter novo
        this.ctx = ctx || this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('❌ Não foi possível obter contexto 2D no renderer');
            return;
        }
        
        this.structure = null;
        
        // Configurações
        this.scale = 100;
        this.panX = this.canvas.width / 2;
        this.panY = this.canvas.height / 2;
        
        console.log('✅ Renderer inicializado. Dimensões:', this.canvas.width, 'x', this.canvas.height);
        
        // Inicializar
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (container) {
            const oldWidth = this.canvas.width;
            const oldHeight = this.canvas.height;
            
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            
            console.log('Renderer: Canvas redimensionado', oldWidth, 'x', oldHeight, '→', this.canvas.width, 'x', this.canvas.height);
            
            // Ajustar pan para manter centro
            this.panX += (this.canvas.width - oldWidth) / 2;
            this.panY += (this.canvas.height - oldHeight) / 2;
            
            this.render();
        }
    }
    
    setStructure(structure) {
        this.structure = structure;
        console.log('Renderer: Estrutura definida', structure);
        this.fitToView();
    }
    
    fitToView() {
        if (!this.structure || !this.structure.nodes || this.structure.nodes.length === 0) {
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
        
        const width = maxX - minX || 10; // Evitar divisão por zero
        const height = maxY - minY || 10;
        const margin = 50;
        
        const scaleX = (this.canvas.width - 2 * margin) / width;
        const scaleY = (this.canvas.height - 2 * margin) / height;
        this.scale = Math.min(scaleX, scaleY, 200);
        
        // Centralizar
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        this.panX = (this.canvas.width / 2) - (centerX * this.scale);
        this.panY = (this.canvas.height / 2) + (centerY * this.scale);
        
        console.log('Renderer: Ajustado à vista. Escala:', this.scale);
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
        
        console.log('Renderer: Cena renderizada');
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
        
        // Origem
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawStructure() {
        if (!this.structure) return;
        
        const ctx = this.ctx;
        
        // Desenhar barras primeiro (no fundo)
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        if (this.structure.beams && this.structure.beams.length > 0) {
            this.structure.beams.forEach(beam => {
                // Encontrar nós da barra
                const startNode = this.structure.nodes.find(n => n.id === beam.startNodeId);
                const endNode = this.structure.nodes.find(n => n.id === beam.endNodeId);
                
                if (startNode && endNode) {
                    const start = this.worldToScreen(startNode.x, startNode.y);
                    const end = this.worldToScreen(endNode.x, endNode.y);
                    
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.stroke();
                    
                    // Rótulo da barra
                    ctx.fillStyle = '#2c3e50';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;
                    ctx.fillText(`B${beam.id}`, midX, midY);
                }
            });
        }
        
        // Desenhar nós (por cima das barras)
        if (this.structure.nodes && this.structure.nodes.length > 0) {
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
                
                // Rótulo do nó
                ctx.fillStyle = '#2c3e50';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`N${node.id}`, screen.x, screen.y - 8);
                
                // Coordenadas pequenas
                ctx.font = '9px Arial';
                ctx.textBaseline = 'top';
                ctx.fillText(`(${node.x.toFixed(1)},${node.y.toFixed(1)})`, screen.x, screen.y + 10);
            });
        }
        
        // Desenhar vínculos
        if (this.structure.supports && this.structure.supports.length > 0) {
            this.structure.supports.forEach(support => {
                const node = this.structure.nodes.find(n => n.id === support.nodeId);
                if (node) {
                    this.drawSupport(node.x, node.y, support.type);
                }
            });
        }
    }
    
    drawSupport(x, y, type) {
        const screen = this.worldToScreen(x, y);
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(screen.x, screen.y);
        
        // Ajustar para desenhar abaixo do nó
        ctx.translate(0, 15);
        
        switch(type) {
            case 'roller':
            case 'pinned':
                // Triângulo para apoio
                ctx.fillStyle = type === 'roller' ? '#3498db' : '#e74c3c';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, 15);
                ctx.lineTo(10, 15);
                ctx.closePath();
                ctx.fill();
                
                if (type === 'roller') {
                    // Círculo para apoio móvel
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(0, 18, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'fixed':
                // Retângulo para engaste
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-8, 0, 16, 20);
                break;
                
            case 'hinge':
                // Círculo para rótula
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
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

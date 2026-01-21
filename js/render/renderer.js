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
        
        // Configurações de exibição
        this.showGrid = true;
        this.showAxes = true;
        this.showNormal = true;
        this.showShear = true;
        this.showMoment = true;
        this.showTorsion = false;
        this.showDeformed = false;
        
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
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Desenhar eixos
        if (this.showAxes) {
            this.drawAxes();
        }
        
        // Desenhar estrutura
        if (this.structure) {
            this.drawStructure();
        }
        
        console.log('Renderer: Cena renderizada');
    }
    
    drawGrid() {
        const ctx = this.ctx;
        
        // Configurações adaptáveis
        const baseGridSize = 1.0; // 1 metro
        let gridSize = baseGridSize;
        
        // Ajustar tamanho do grid baseado no zoom
        if (this.scale > 150) {
            gridSize = 0.5; // Zoom in: grid mais fino
        } else if (this.scale > 80) {
            gridSize = 1.0;
        } else if (this.scale > 40) {
            gridSize = 2.0;
        } else if (this.scale > 20) {
            gridSize = 5.0;
        } else {
            gridSize = 10.0; // Zoom out: grid mais grosso
        }
        
        // Calcular área visível
        const visibleLeft = -this.panX / this.scale;
        const visibleRight = (this.canvas.width - this.panX) / this.scale;
        const visibleTop = (this.canvas.height - this.panY) / this.scale;
        const visibleBottom = -this.panY / this.scale;
        
        // Ajustar limites
        const startX = Math.floor(visibleLeft / gridSize) * gridSize;
        const endX = Math.ceil(visibleRight / gridSize) * gridSize;
        const startY = Math.floor(visibleBottom / gridSize) * gridSize;
        const endY = Math.ceil(visibleTop / gridSize) * gridSize;
        
        // Sub-grade (mais fina e clara)
        if (gridSize >= 1.0) {
            const subGridSize = gridSize / 5;
            ctx.strokeStyle = 'rgba(200, 200, 220, 0.15)';
            ctx.lineWidth = 0.5;
            
            for (let x = startX; x <= endX; x += subGridSize) {
                const screen = this.worldToScreen(x, 0);
                ctx.beginPath();
                ctx.moveTo(screen.x, 0);
                ctx.lineTo(screen.x, this.canvas.height);
                ctx.stroke();
            }
            
            for (let y = startY; y <= endY; y += subGridSize) {
                const screen = this.worldToScreen(0, y);
                ctx.beginPath();
                ctx.moveTo(0, screen.y);
                ctx.lineTo(this.canvas.width, screen.y);
                ctx.stroke();
            }
        }
        
        // Grade principal
        ctx.strokeStyle = 'rgba(180, 180, 200, 0.3)';
        ctx.lineWidth = 1;
        
        for (let x = startX; x <= endX; x += gridSize) {
            const screen = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screen.x, 0);
            ctx.lineTo(screen.x, this.canvas.height);
            ctx.stroke();
            
            // Rótulos (apenas para linhas principais e se zoom suficiente)
            if (this.scale > 40 && Math.abs(x % 5) < 0.001) {
                ctx.fillStyle = 'rgba(100, 100, 120, 0.7)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`${x.toFixed(0)}m`, screen.x, 5);
            }
        }
        
        for (let y = startY; y <= endY; y += gridSize) {
            const screen = this.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screen.y);
            ctx.lineTo(this.canvas.width, screen.y);
            ctx.stroke();
            
            // Rótulos
            if (this.scale > 40 && Math.abs(y % 5) < 0.001) {
                ctx.fillStyle = 'rgba(100, 100, 120, 0.7)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${y.toFixed(0)}m`, this.canvas.width - 5, screen.y);
            }
        }
        
        // Linhas principais mais escuras (a cada 5 unidades)
        ctx.strokeStyle = 'rgba(150, 150, 180, 0.5)';
        ctx.lineWidth = 1.5;
        
        for (let x = startX; x <= endX; x += gridSize * 5) {
            const screen = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screen.x, 0);
            ctx.lineTo(screen.x, this.canvas.height);
            ctx.stroke();
        }
        
        for (let y = startY; y <= endY; y += gridSize * 5) {
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
        
        // Rótulos dos eixos
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('X', this.canvas.width - 5, origin.y - 5);
        ctx.textAlign = 'left';
        ctx.fillText('Y', origin.x + 5, 15);
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
                    
                    // Rótulo da barra (apenas se zoom suficiente)
                    if (this.scale > 40) {
                        ctx.fillStyle = '#2c3e50';
                        ctx.font = 'bold 11px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;
                        
                        // Fundo para legibilidade
                        const text = `B${beam.id}`;
                        const textWidth = ctx.measureText(text).width;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.fillRect(midX - textWidth/2 - 2, midY - 9, textWidth + 4, 18);
                        
                        // Texto
                        ctx.fillStyle = '#2c3e50';
                        ctx.fillText(text, midX, midY);
                    }
                }
            });
        }
        
        // Desenhar nós (por cima das barras)
        if (this.structure.nodes && this.structure.nodes.length > 0) {
            this.structure.nodes.forEach(node => {
                const screen = this.worldToScreen(node.x, node.y);
                
                // Círculo do nó (com destaque se selecionado)
                if (node._highlighted) {
                    // Nó destacado (para criação de barras)
                    ctx.fillStyle = '#e74c3c'; // Vermelho para destaque
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2); // Maior
                    ctx.fill();
                    
                    // Anel brilhante
                    ctx.strokeStyle = '#ff6b6b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 10, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // Nó normal
                    ctx.fillStyle = '#3498db';
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
                
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
                
                // Fundo para legibilidade
                const nodeText = `N${node.id}`;
                const textWidth = ctx.measureText(nodeText).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(screen.x - textWidth/2 - 2, screen.y - 22, textWidth + 4, 16);
                
                // Texto
                ctx.fillStyle = '#2c3e50';
                ctx.fillText(nodeText, screen.x, screen.y - 8);
                
                // Coordenadas pequenas (apenas se zoom suficiente)
                if (this.scale > 60) {
                    ctx.font = '9px Arial';
                    ctx.textBaseline = 'top';
                    const coordText = `(${node.x.toFixed(1)},${node.y.toFixed(1)})`;
                    const coordWidth = ctx.measureText(coordText).width;
                    
                    // Fundo
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.fillRect(screen.x - coordWidth/2 - 2, screen.y + 2, coordWidth + 4, 14);
                    
                    // Texto
                    ctx.fillStyle = '#666';
                    ctx.fillText(coordText, screen.x, screen.y + 10);
                }
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
        
        // Desenhar cargas (simplificado)
        if (this.structure.nodes && this.structure.nodes.length > 0) {
            this.structure.nodes.forEach(node => {
                if (node.loads && node.loads.length > 0) {
                    this.drawLoads(node.x, node.y, node.loads);
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
                // Apoio móvel
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, 15);
                ctx.lineTo(10, 15);
                ctx.closePath();
                ctx.fill();
                
                // Círculos para rolagem
                ctx.fillStyle = '#fff';
                for (let i = -6; i <= 6; i += 4) {
                    ctx.beginPath();
                    ctx.arc(i, 18, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'pinned':
                // Apoio fixo
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, 15);
                ctx.lineTo(10, 15);
                ctx.closePath();
                ctx.fill();
                
                // Círculo de pino
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(0, 8, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'fixed':
                // Engaste
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-8, 0, 16, 20);
                
                // Linhas diagonais
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                for (let i = -6; i <= 6; i += 4) {
                    ctx.beginPath();
                    ctx.moveTo(i, 5);
                    ctx.lineTo(i - 2, 15);
                    ctx.stroke();
                }
                break;
                
            case 'hinge':
                // Rótula
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Linha central
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-6, 0);
                ctx.lineTo(6, 0);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
    
    drawLoads(x, y, loads) {
        const screen = this.worldToScreen(x, y);
        const ctx = this.ctx;
        
        loads.forEach((load, index) => {
            ctx.save();
            ctx.translate(screen.x, screen.y);
            
            if (load.type === 'point') {
                // Converter direção para radianos
                const angle = (load.direction * Math.PI) / 180;
                const length = 30;
                
                // Seta da carga
                ctx.strokeStyle = '#e74c3c';
                ctx.fillStyle = '#e74c3c';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(angle) * length,
                    -Math.sin(angle) * length // Negativo porque Y cresce para baixo no canvas
                );
                ctx.stroke();
                
                // Cabeça da seta
                ctx.beginPath();
                const tipX = Math.cos(angle) * length;
                const tipY = -Math.sin(angle) * length;
                ctx.translate(tipX, tipY);
                ctx.rotate(angle);
                
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, -5);
                ctx.lineTo(-10, 5);
                ctx.closePath();
                ctx.fill();
                
                // Valor da carga
                ctx.rotate(-angle);
                ctx.translate(-tipX, -tipY);
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`${load.magnitude} kN`, tipX/2, -tipY/2 - 5);
            }
            
            ctx.restore();
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
        switch(type) {
            case 'N': this.showNormal = show; break;
            case 'V': this.showShear = show; break;
            case 'M': this.showMoment = show; break;
            case 'T': this.showTorsion = show; break;
        }
        console.log(`Diagrama ${type}: ${show ? 'ligado' : 'desligado'}`);
        this.render();
    }
    
    toggleDeformedShape(show) {
        this.showDeformed = show;
        console.log(`Forma deformada: ${show ? 'ligada' : 'desligada'}`);
        this.render();
    }
}

// Adicionar DiagramRenderer ao StructureRenderer
StructureRenderer.prototype.addDiagramRenderer = function() {
    this.diagramRenderer = new DiagramRenderer(this);
    console.log('DiagramRenderer adicionado ao StructureRenderer');
};

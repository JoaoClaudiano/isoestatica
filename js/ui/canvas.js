// Gerenciamento de interações com o canvas

class CanvasInteractions {
    constructor(renderer, app) {
        this.renderer = renderer;
        this.app = app;
        this.canvas = renderer.canvas;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.panStart = { x: 0, y: 0 };
        this.currentPan = { x: 0, y: 0 };
        this.selection = null;
        
        this.init();
    }

    
    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Eventos de mouse
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        // Eventos de toque
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Prevenir menu de contexto
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (e.button === 0) { // Botão esquerdo
            // Verificar se clicou em um elemento
            const worldPos = this.renderer.screenToWorld(x, y);
            const element = this.findElementAt(worldPos.x, worldPos.y);
            
            if (element) {
                this.selection = element;
                this.isDragging = true;
                this.dragStart = { x: worldPos.x, y: worldPos.y };
                this.app.selectedElement = element;
                this.app.updateSelectionInfo();
            } else {
                // Iniciar pan
                this.isDragging = true;
                this.panStart = { x, y };
                this.currentPan = { ...this.renderer.pan };
            }
        }
        
        this.renderer.render();
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging) {
            if (this.selection) {
                // Arrastar elemento
                const worldPos = this.renderer.screenToWorld(x, y);
                const dx = worldPos.x - this.dragStart.x;
                const dy = worldPos.y - this.dragStart.y;
                
                this.moveElement(this.selection, dx, dy);
                this.dragStart = worldPos;
            } else {
                // Pan da vista
                const dx = x - this.panStart.x;
                const dy = y - this.panStart.y;
                
                this.renderer.panX = this.currentPan.x + dx;
                this.renderer.panY = this.currentPan.y + dy;
            }
            
            this.renderer.render();
        }
        
        // Atualizar coordenadas (já feito no app.js)
    }

    onMouseUp(e) {
        this.isDragging = false;
        this.selection = null;
    }

    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const worldPosBefore = this.renderer.screenToWorld(x, y);
        
        // Ajustar zoom
        const delta = e.deltaY > 0 ? 0.8 : 1.2;
        this.renderer.scale *= delta;
        
        // Ajustar pan para manter o ponto sob o mouse
        const worldPosAfter = this.renderer.screenToWorld(x, y);
        const dx = worldPosAfter.x - worldPosBefore.x;
        const dy = worldPosAfter.y - worldPosBefore.y;
        
        this.renderer.panX += dx * this.renderer.scale;
        this.renderer.panY -= dy * this.renderer.scale;
        
        this.renderer.render();
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Simular clique
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
        }
        e.preventDefault();
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Simular movimento do mouse
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
        e.preventDefault();
    }

    onTouchEnd(e) {
        this.onMouseUp(e);
        e.preventDefault();
    }

    findElementAt(x, y, tolerance = 0.5) {
        if (!this.app.currentStructure) return null;
        
        // Verificar nós
        for (const node of this.app.currentStructure.nodes) {
            const dist = Utils.distance(x, y, node.x, node.y);
            if (dist < tolerance) {
                return { type: 'node', element: node };
            }
        }
        
        // Verificar barras
        for (const beam of this.app.currentStructure.beams) {
            if (Utils.pointNearLine(x, y, beam.start.x, beam.start.y, beam.end.x, beam.end.y, tolerance)) {
                return { type: 'beam', element: beam };
            }
        }
        
        return null;
    }

    moveElement(element, dx, dy) {
        if (element.type === 'node') {
            const node = element.element;
            node.x += dx;
            node.y += dy;
            
            // Atualizar barras conectadas
            this.app.currentStructure.beams.forEach(beam => {
                if (beam.start === node || beam.end === node) {
                    // Recalcular comprimento e ângulo
                    beam.length = Utils.distance(beam.start.x, beam.start.y, beam.end.x, beam.end.y);
                    beam.angle = Utils.angleBetween(beam.start.x, beam.start.y, beam.end.x, beam.end.y);
                }
            });
        }
    }
}

window.CanvasInteractions = CanvasInteractions;

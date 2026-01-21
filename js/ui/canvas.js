// Manipulação de eventos do canvas
class CanvasHandler {
    constructor(app, renderer) {
        this.app = app;
        this.renderer = renderer;
        this.canvas = document.getElementById('structure-canvas');
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.panStartX = 0;
        this.panStartY = 0;
        this.selectionStart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvasResize();
    }

    setupEventListeners() {
        // Eventos de mouse
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
        
        // Eventos de toque (para dispositivos móveis)
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevenir menu de contexto
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    setupCanvasResize() {
        // Redimensionar canvas quando a janela mudar de tamanho
        const resizeObserver = new ResizeObserver(() => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.renderer.render();
        });
        
        resizeObserver.observe(this.canvas.parentElement);
    }

    handleCanvasMouseDown(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.lastMouseX = x;
        this.lastMouseY = y;
        this.panStartX = x;
        this.panStartY = y;
        
        const worldCoords = this.renderer.screenToWorld(x, y);
        
        // Verificar qual ferramenta está ativa
        const currentTool = this.app.ui?.getCurrentTool?.() || 'select';
        
        switch(currentTool) {
            case 'pan':
                this.isDragging = true;
                this.canvas.style.cursor = 'grabbing';
                break;
                
            case 'select':
                // Tentar selecionar elemento
                this.trySelectElement(worldCoords.x, worldCoords.y);
                break;
                
            case 'node':
                this.app.addNode(worldCoords.x, worldCoords.y);
                break;
                
            case 'beam':
                this.selectionStart = worldCoords;
                break;
                
            case 'delete':
                this.app.deleteAt(worldCoords.x, worldCoords.y);
                break;
                
            case 'support':
                if (this.app.ui?.getCurrentSupportType) {
                    const supportType = this.app.ui.getCurrentSupportType();
                    const node = this.app.findNearestNode(worldCoords.x, worldCoords.y, 0.5);
                    if (node) {
                        this.app.currentStructure.addSupport(node, supportType);
                        this.app.updateStructureInfo();
                        this.renderer.render();
                    }
                }
                break;
                
            case 'load':
                if (this.app.ui?.getCurrentLoadType) {
                    const loadType = this.app.ui.getCurrentLoadType();
                    const magnitude = parseFloat(document.getElementById('load-magnitude')?.value || '10');
                    const direction = parseFloat(document.getElementById('load-direction')?.value || '270');
                    
                    if (loadType === 'point') {
                        const node = this.app.findNearestNode(worldCoords.x, worldCoords.y, 0.5);
                        if (node) {
                            this.app.currentStructure.addPointLoad(node, magnitude, direction);
                            this.app.updateStatusMessage(`Carga pontual de ${magnitude} kN adicionada`);
                            this.renderer.render();
                        }
                    } else if (loadType === 'moment') {
                        const node = this.app.findNearestNode(worldCoords.x, worldCoords.y, 0.5);
                        if (node) {
                            this.app.currentStructure.addMoment(node, magnitude);
                            this.app.updateStatusMessage(`Momento de ${magnitude} kN.m adicionado`);
                            this.renderer.render();
                        }
                    }
                }
                break;
        }
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Atualizar coordenadas na tela
        const worldCoords = this.renderer.screenToWorld(x, y);
        const coordDisplay = document.getElementById('coordinate-display');
        if (coordDisplay) {
            coordDisplay.textContent = `X: ${worldCoords.x.toFixed(2)} m, Y: ${worldCoords.y.toFixed(2)} m`;
        }
        
        // Verificar se está arrastando (pan)
        if (this.isDragging) {
            const dx = x - this.lastMouseX;
            const dy = y - this.lastMouseY;
            
            this.renderer.panX += dx;
            this.renderer.panY += dy;
            this.renderer.render();
        }
        
        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    handleCanvasMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldCoords = this.renderer.screenToWorld(x, y);
        
        // Verificar se foi um clique (não arrasto)
        const dx = x - this.panStartX;
        const dy = y - this.panStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5 && this.app.ui?.getCurrentTool?.() === 'beam' && this.selectionStart) {
            // Conectar nós para criar barra
            const startNode = this.app.findNearestNode(this.selectionStart.x, this.selectionStart.y, 0.5);
            const endNode = this.app.findNearestNode(worldCoords.x, worldCoords.y, 0.5);
            
            if (startNode && endNode && startNode !== endNode) {
                this.app.currentStructure.addBeam(startNode, endNode);
                this.app.updateStructureInfo();
                this.app.updateStatusMessage('Barra adicionada');
                this.renderer.render();
            }
        }
        
        // Resetar estados
        this.isDragging = false;
        this.selectionStart = null;
        this.canvas.style.cursor = 'default';
        
        // Atualizar cursor baseado na ferramenta
        const currentTool = this.app.ui?.getCurrentTool?.() || 'select';
        if (currentTool === 'pan') {
            this.canvas.style.cursor = 'grab';
        }
    }

    handleCanvasWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Zoom no ponto do mouse
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // Calcular coordenadas do mundo no ponto do mouse
        const worldBeforeZoom = this.renderer.screenToWorld(x, y);
        
        // Aplicar zoom
        this.renderer.scale *= zoomFactor;
        
        // Ajustar pan para manter o ponto do mouse no mesmo lugar
        const worldAfterZoom = this.renderer.screenToWorld(x, y);
        const dx = (worldAfterZoom.x - worldBeforeZoom.x) * this.renderer.scale;
        const dy = (worldAfterZoom.y - worldBeforeZoom.y) * this.renderer.scale;
        
        this.renderer.panX += dx;
        this.renderer.panY -= dy;
        
        this.renderer.render();
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.lastMouseX = x;
            this.lastMouseY = y;
            this.panStartX = x;
            this.panStartY = y;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Pan
            const dx = x - this.lastMouseX;
            const dy = y - this.lastMouseY;
            
            this.renderer.panX += dx;
            this.renderer.panY += dy;
            this.renderer.render();
            
            this.lastMouseX = x;
            this.lastMouseY = y;
        } else if (e.touches.length === 2) {
            // Zoom com dois dedos
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const rect = this.canvas.getBoundingClientRect();
            const x1 = touch1.clientX - rect.left;
            const y1 = touch1.clientY - rect.top;
            const x2 = touch2.clientX - rect.left;
            const y2 = touch2.clientY - rect.top;
            
            // Calcular distância atual
            const currentDist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            
            if (this.lastTouchDistance) {
                const scale = currentDist / this.lastTouchDistance;
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;
                
                // Zoom no centro
                const worldBeforeZoom = this.renderer.screenToWorld(centerX, centerY);
                this.renderer.scale *= scale;
                const worldAfterZoom = this.renderer.screenToWorld(centerX, centerY);
                
                const dx = (worldAfterZoom.x - worldBeforeZoom.x) * this.renderer.scale;
                const dy = (worldAfterZoom.y - worldBeforeZoom.y) * this.renderer.scale;
                
                this.renderer.panX += dx;
                this.renderer.panY -= dy;
                this.renderer.render();
            }
            
            this.lastTouchDistance = currentDist;
        }
    }

    handleTouchEnd(e) {
        if (e.touches.length === 0) {
            this.lastTouchDistance = null;
        }
    }

    handleKeyDown(e) {
        // Atalhos de teclado
        switch(e.key.toLowerCase()) {
            case 'n':
                this.app.ui?.setTool?.('node');
                e.preventDefault();
                break;
            case 'b':
                this.app.ui?.setTool?.('beam');
                e.preventDefault();
                break;
            case 'delete':
            case 'backspace':
                this.app.ui?.setTool?.('delete');
                e.preventDefault();
                break;
            case ' ':
                this.app.ui?.setTool?.('pan');
                e.preventDefault();
                break;
            case 'f':
                this.renderer.fitToView();
                e.preventDefault();
                break;
            case '+':
            case '=':
                if (e.ctrlKey || e.metaKey) {
                    this.renderer.zoomIn();
                    e.preventDefault();
                }
                break;
            case '-':
                if (e.ctrlKey || e.metaKey) {
                    this.renderer.zoomOut();
                    e.preventDefault();
                }
                break;
            case '0':
                if (e.ctrlKey || e.metaKey) {
                    this.renderer.fitToView();
                    e.preventDefault();
                }
                break;
        }
    }

    handleKeyUp(e) {
        if (e.key === ' ' && this.app.ui?.getCurrentTool?.() === 'pan') {
            this.app.ui.setTool('select');
        }
    }

    trySelectElement(x, y) {
        // Implementar seleção de elementos
        // Por enquanto, apenas limpar seleção
        this.app.selectedElement = null;
        this.app.updateSelectionInfo();
    }

    getCanvas() {
        return this.canvas;
    }

    setCursor(cursor) {
        this.canvas.style.cursor = cursor;
    }
}

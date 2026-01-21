// CanvasHandler Simplificado
class CanvasHandler {
    constructor(app, renderer) {
        this.app = app;
        this.renderer = renderer;
        this.canvas = document.getElementById('structure-canvas');
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        if (this.canvas) {
            this.init();
        } else {
            console.error('Canvas não encontrado!');
        }
    }
    
    init() {
        this.setupEventListeners();
        this.setupCanvasResize();
    }
    
    setupEventListeners() {
        // Eventos de mouse
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Prevenir menu de contexto
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupCanvasResize() {
        // Redimensionar canvas
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            if (container) {
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
                if (this.renderer) this.renderer.render();
            }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    onMouseDown(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.lastX = x;
        this.lastY = y;
        
        const worldCoords = this.renderer.screenToWorld(x, y);
        const currentTool = this.app.ui?.getCurrentTool?.() || 'select';
        
        switch(currentTool) {
            case 'node':
                this.addNode(worldCoords.x, worldCoords.y);
                break;
            case 'pan':
                this.isDragging = true;
                this.canvas.style.cursor = 'grabbing';
                break;
            case 'select':
            default:
                // Selecionar ou interagir
                break;
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Atualizar coordenadas
        const worldCoords = this.renderer.screenToWorld(x, y);
        const coordDisplay = document.getElementById('coordinate-display');
        if (coordDisplay) {
            coordDisplay.textContent = `X: ${worldCoords.x.toFixed(2)} m, Y: ${worldCoords.y.toFixed(2)} m`;
        }
        
        // Pan
        if (this.isDragging) {
            const dx = x - this.lastX;
            const dy = y - this.lastY;
            
            this.renderer.panX += dx;
            this.renderer.panY += dy;
            this.renderer.render();
        }
        
        this.lastX = x;
        this.lastY = y;
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        const currentTool = this.app.ui?.getCurrentTool?.() || 'select';
        if (currentTool === 'pan') {
            this.canvas.style.cursor = 'grab';
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const worldBefore = this.renderer.screenToWorld(x, y);
        
        this.renderer.scale *= zoomFactor;
        
        const worldAfter = this.renderer.screenToWorld(x, y);
        const dx = (worldAfter.x - worldBefore.x) * this.renderer.scale;
        const dy = (worldAfter.y - worldBefore.y) * this.renderer.scale;
        
        this.renderer.panX += dx;
        this.renderer.panY -= dy;
        
        this.renderer.render();
    }
    
    addNode(x, y) {
        if (this.app.currentStructure) {
            const node = this.app.currentStructure.addNode(x, y);
            this.app.updateStructureInfo();
            this.app.updateStatusMessage(`Nó adicionado em (${x.toFixed(2)}, ${y.toFixed(2)})`);
            this.renderer.render();
        }
    }
}

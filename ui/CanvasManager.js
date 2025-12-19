// GERENCIADOR DO CANVAS
class CanvasManager {
    constructor(canvasId, app) {
        this.canvas = document.getElementById(canvasId);
        this.app = app;
        this.objects = [];
        this.currentId = 1;
        
        this.initFabric();
    }
    
    initFabric() {
        this.fabricCanvas = this.app.fabricCanvas;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.fabricCanvas.on('mouse:down', (e) => {
            this.handleCanvasClick(e);
        });
        
        this.fabricCanvas.on('object:moving', (e) => {
            this.handleObjectMoving(e);
        });
        
        this.fabricCanvas.on('object:modified', (e) => {
            this.handleObjectModified(e);
        });
    }
    
    handleCanvasClick(e) {
        const pointer = this.fabricCanvas.getPointer(e.e);
        const x = pointer.x / this.app.state.scale;
        
        // Verificar se o clique foi na viga (eixo Y do centro)
        const beamY = this.canvas.height / 2;
        const tolerance = 20;
        
        if (Math.abs(pointer.y - beamY) > tolerance) {
            return; // Clique fora da viga
        }
        
        // Verificar qual ferramenta está ativa
        switch (this.app.state.activeTool) {
            case 'support_fixed':
                this.addFixedSupport(x);
                break;
            case 'support_movable':
                this.addMovableSupport(x);
                break;
            case 'load_concentrated':
                this.addConcentratedLoad(x);
                break;
            case 'load_distributed':
                this.addDistributedLoad(x);
                break;
            case 'moment':
                this.addMoment(x);
                break;
        }
    }
    
    addFixedSupport(x) {
        const y = this.canvas.height / 2;
        const scale = this.app.state.scale;
        
        // Triângulo para apoio fixo
        const triangle = new fabric.Triangle({
            left: x * scale,
            top: y,
            width: 30,
            height: 30,
            fill: '#e74c3c',
            angle: 180,
            originX: 'center',
            originY: 'bottom',
            hasControls: true,
            hasBorders: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true
        });
        
        triangle.elementType = 'support_fixed';
        triangle.position = x;
        triangle.value = 0; // Reação será calculada
        
        this.fabricCanvas.add(triangle);
        this.objects.push(triangle);
    }
    
    addMovableSupport(x) {
        const y = this.canvas.height / 2;
        const scale = this.app.state.scale;
        
        // Círculo sobre linha para apoio móvel
        const line = new fabric.Line([
            x * scale - 15, y + 15,
            x * scale + 15, y + 15
        ], {
            stroke: '#3498db',
            strokeWidth: 3,
            strokeLineCap: 'round'
        });
        
        const circle = new fabric.Circle({
            left: x * scale,
            top: y + 15,
            radius: 8,
            fill: '#3498db',
            originX: 'center',
            originY: 'center'
        });
        
        const group = new fabric.Group([line, circle], {
            left: x * scale,
            top: y,
            originX: 'center',
            originY: 'bottom',
            hasControls: true,
            hasBorders: true
        });
        
        group.elementType = 'support_movable';
        group.position = x;
        group.value = 0;
        
        this.fabricCanvas.add(group);
        this.objects.push(group);
    }
    
    addConcentratedLoad(x) {
        const y = this.canvas.height / 2;
        const scale = this.app.state.scale;
        
        // Seta para baixo (carga concentrada)
        const arrow = new fabric.Triangle({
            left: x * scale,
            top: y - 40,
            width: 20,
            height: 30,
            fill: '#2ecc71',
            angle: 180,
            originX: 'center',
            originY: 'bottom'
        });
        
        const line = new fabric.Line([
            x * scale, y,
            x * scale, y - 40
        ], {
            stroke: '#2ecc71',
            strokeWidth: 2
        });
        
        const text = new fabric.Text('10 kN', {
            left: x * scale,
            top: y - 50,
            fontSize: 12,
            fill: '#2c3e50',
            originX: 'center',
            originY: 'bottom'
        });
        
        const group = new fabric.Group([line, arrow, text], {
            left: x * scale,
            top: y,
            originX: 'center',
            originY: 'top',
            hasControls: true,
            hasBorders: true
        });
        
        group.elementType = 'load_concentrated';
        group.position = x;
        group.value = 10;
        group.direction = 'down';
        
        this.fabricCanvas.add(group);
        this.objects.push(group);
    }
    
    addDistributedLoad(startX) {
        const y = this.canvas.height / 2;
        const scale = this.app.state.scale;
        const length = 2; // metros padrão
        
        // Linha horizontal com setas
        const line = new fabric.Line([
            startX * scale, y - 20,
            (startX + length) * scale, y - 20
        ], {
            stroke: '#f39c12',
            strokeWidth: 2
        });
        
        // Múltiplas setas
        const arrows = [];
        const numArrows = 5;
        
        for (let i = 0; i < numArrows; i++) {
            const posX = startX * scale + (i * (length * scale) / (numArrows - 1));
            const arrow = new fabric.Triangle({
                left: posX,
                top: y - 25,
                width: 10,
                height: 15,
                fill: '#f39c12',
                angle: 180,
                originX: 'center',
                originY: 'bottom'
            });
            arrows.push(arrow);
        }
        
        const text = new fabric.Text('5 kN/m', {
            left: (startX + length/2) * scale,
            top: y - 35,
            fontSize: 12,
            fill: '#2c3e50',
            originX: 'center',
            originY: 'bottom'
        });
        
        const group = new fabric.Group([line, ...arrows, text], {
            left: startX * scale,
            top: y,
            originX: 'left',
            originY: 'top',
            hasControls: true,
            hasBorders: true
        });
        
        group.elementType = 'load_distributed';
        group.position = startX;
        group.value = 5;
        group.length = length;
        group.direction = 'down';
        
        this.fabricCanvas.add(group);
        this.objects.push(group);
    }
    
    addMoment(x) {
        const y = this.canvas.height / 2;
        const scale = this.app.state.scale;
        
        // Seta circular para momento
        const circle = new fabric.Circle({
            left: x * scale,
            top: y - 30,
            radius: 20,
            fill: 'transparent',
            stroke: '#9b59b6',
            strokeWidth: 2
        });
        
        const arrow = new fabric.Triangle({
            left: x * scale + 20,
            top: y - 30,
            width: 10,
            height: 10,
            fill: '#9b59b6',
            angle: -90,
            originX: 'center',
            originY: 'center'
        });
        
        const text = new fabric.Text('5 kN.m', {
            left: x * scale,
            top: y - 55,
            fontSize: 12,
            fill: '#2c3e50',
            originX: 'center',
            originY: 'bottom'
        });
        
        const group = new fabric.Group([circle, arrow, text], {
            left: x * scale,
            top: y,
            originX: 'center',
            originY: 'top',
            hasControls: true,
            hasBorders: true
        });
        
        group.elementType = 'moment';
        group.position = x;
        group.value = 5;
        
        this.fabricCanvas.add(group);
        this.objects.push(group);
    }
    
    handleObjectMoving(e) {
        const obj = e.target;
        const scale = this.app.state.scale;
        
        // Restringir movimento vertical (manter na viga)
        obj.set({
            top: this.canvas.height / 2 - (obj.originY === 'bottom' ? obj.height * obj.scaleY : 0)
        });
        
        // Atualizar posição no estado
        if (obj.elementType) {
            obj.position = obj.left / scale;
            
            // Atualizar texto de posição se existir
            if (obj._objects && obj._objects.some(o => o.type === 'text')) {
                this.updateObjectText(obj);
            }
        }
    }
    
    handleObjectModified(e) {
        const obj = e.target;
        
        if (obj.elementType === 'load_distributed') {
            // Atualizar comprimento da carga distribuída
            const scale = this.app.state.scale;
            obj.length = (obj.width * obj.scaleX) / scale;
            this.updateObjectText(obj);
        }
    }
    
    updateObjectText(obj) {
        if (!obj._objects) return;
        
        const textObj = obj._objects.find(o => o.type === 'text');
        if (!textObj) return;
        
        switch (obj.elementType) {
            case 'load_concentrated':
                textObj.set('text', `${obj.value} ${this.app.state.units}`);
                break;
            case 'load_distributed':
                textObj.set('text', `${obj.value} ${this.app.state.units}/m`);
                break;
            case 'moment':
                textObj.set('text', `${obj.value} ${this.app.state.units}.m`);
                break;
        }
        
        obj.dirty = true;
        this.fabricCanvas.renderAll();
    }
    
    getObjectAt(x, y) {
        return this.objects.find(obj => {
            const bounds = obj.getBoundingRect();
            return x >= bounds.left && x <= bounds.left + bounds.width &&
                   y >= bounds.top && y <= bounds.top + bounds.height;
        });
    }
    
    removeObject(obj) {
        this.fabricCanvas.remove(obj);
        this.objects = this.objects.filter(o => o !== obj);
    }
    
    clearAll() {
        this.objects.forEach(obj => {
            this.fabricCanvas.remove(obj);
        });
        this.objects = [];
    }
}
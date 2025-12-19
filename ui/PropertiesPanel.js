// PAINEL DE PROPRIEDADES
class PropertiesPanel {
    constructor(app) {
        this.app = app;
        this.panel = document.getElementById('properties-panel');
    }
    
    update(element) {
        if (!element || !element.elementType) {
            this.clear();
            return;
        }
        
        let html = '';
        
        switch (element.elementType) {
            case 'support_fixed':
            case 'support_movable':
                html = this.getSupportProperties(element);
                break;
            case 'load_concentrated':
                html = this.getConcentratedLoadProperties(element);
                break;
            case 'load_distributed':
                html = this.getDistributedLoadProperties(element);
                break;
            case 'moment':
                html = this.getMomentProperties(element);
                break;
            default:
                html = '<p>Elemento não reconhecido</p>';
        }
        
        this.panel.innerHTML = html;
        this.attachEventListeners(element);
    }
    
    getSupportProperties(support) {
        return `
            <h4><i class="fas fa-grip-lines-vertical"></i> Apoio</h4>
            <div class="property-group">
                <label for="support-position">Posição (m):</label>
                <input type="number" id="support-position" 
                       value="${support.position.toFixed(2)}" 
                       step="0.1" min="0" max="${this.app.state.beamLength}">
            </div>
            <div class="property-group">
                <label>Tipo:</label>
                <span>${support.elementType === 'support_fixed' ? 'Fixo' : 'Móvel'}</span>
            </div>
            <button id="delete-element" class="btn btn-danger">
                <i class="fas fa-trash"></i> Remover Apoio
            </button>
        `;
    }
    
    getConcentratedLoadProperties(load) {
        const direction = load.direction || 'down';
        const units = this.app.state.units;
        
        return `
            <h4><i class="fas fa-arrow-down"></i> Carga Concentrada</h4>
            <div class="property-group">
                <label for="load-position">Posição (m):</label>
                <input type="number" id="load-position" 
                       value="${load.position.toFixed(2)}" 
                       step="0.1" min="0" max="${this.app.state.beamLength}">
            </div>
            <div class="property-group">
                <label for="load-value">Valor (${units}):</label>
                <input type="number" id="load-value" 
                       value="${load.value}" step="1">
            </div>
            <div class="property-group">
                <label for="load-direction">Direção:</label>
                <select id="load-direction">
                    <option value="down" ${direction === 'down' ? 'selected' : ''}>Para baixo ↓</option>
                    <option value="up" ${direction === 'up' ? 'selected' : ''}>Para cima ↑</option>
                </select>
            </div>
            <button id="delete-element" class="btn btn-danger">
                <i class="fas fa-trash"></i> Remover Carga
            </button>
        `;
    }
    
    getDistributedLoadProperties(load) {
        const direction = load.direction || 'down';
        const units = this.app.state.units;
        
        return `
            <h4><i class="fas fa-arrows-alt-h"></i> Carga Distribuída</h4>
            <div class="property-group">
                <label for="dist-start">Início (m):</label>
                <input type="number" id="dist-start" 
                       value="${load.position.toFixed(2)}" 
                       step="0.1" min="0" max="${this.app.state.beamLength}">
            </div>
            <div class="property-group">
                <label for="dist-length">Comprimento (m):</label>
                <input type="number" id="dist-length" 
                       value="${(load.length || 2).toFixed(2)}" 
                       step="0.1" min="0.5" max="${this.app.state.beamLength}">
            </div>
            <div class="property-group">
                <label for="dist-value">Intensidade (${units}/m):</label>
                <input type="number" id="dist-value" 
                       value="${load.value}" step="1">
            </div>
            <div class="property-group">
                <label for="dist-direction">Direção:</label>
                <select id="dist-direction">
                    <option value="down" ${direction === 'down' ? 'selected' : ''}>Para baixo ↓</option>
                    <option value="up" ${direction === 'up' ? 'selected' : ''}>Para cima ↑</option>
                </select>
            </div>
            <button id="delete-element" class="btn btn-danger">
                <i class="fas fa-trash"></i> Remover Carga
            </button>
        `;
    }
    
    getMomentProperties(moment) {
        const units = this.app.state.units;
        
        return `
            <h4><i class="fas fa-redo"></i> Momento Fletor</h4>
            <div class="property-group">
                <label for="moment-position">Posição (m):</label>
                <input type="number" id="moment-position" 
                       value="${moment.position.toFixed(2)}" 
                       step="0.1" min="0" max="${this.app.state.beamLength}">
            </div>
            <div class="property-group">
                <label for="moment-value">Valor (${units}.m):</label>
                <input type="number" id="moment-value" 
                       value="${moment.value}" step="1">
            </div>
            <div class="property-group">
                <label>Sinal:</label>
                <span>${moment.value >= 0 ? 'Anti-horário ↺' : 'Horário ↻'}</span>
            </div>
            <button id="delete-element" class="btn btn-danger">
                <i class="fas fa-trash"></i> Remover Momento
            </button>
        `;
    }
    
    attachEventListeners(element) {
        // Posição
        const positionInput = document.getElementById('support-position') || 
                             document.getElementById('load-position') ||
                             document.getElementById('dist-start') ||
                             document.getElementById('moment-position');
        
        if (positionInput) {
            positionInput.addEventListener('change', (e) => {
                const newPosition = parseFloat(e.target.value);
                const scale = this.app.state.scale;
                
                element.set({
                    left: newPosition * scale
                });
                element.position = newPosition;
                
                this.app.fabricCanvas.renderAll();
            });
        }
        
        // Valor da carga
        const valueInput = document.getElementById('load-value') || 
                          document.getElementById('dist-value') ||
                          document.getElementById('moment-value');
        
        if (valueInput) {
            valueInput.addEventListener('change', (e) => {
                element.value = parseFloat(e.target.value);
                this.app.canvasManager.updateObjectText(element);
            });
        }
        
        // Comprimento da carga distribuída
        const lengthInput = document.getElementById('dist-length');
        if (lengthInput) {
            lengthInput.addEventListener('change', (e) => {
                element.length = parseFloat(e.target.value);
                const scale = this.app.state.scale;
                
                // Atualizar largura do grupo
                element.set({
                    scaleX: (element.length * scale) / (element.width || 1)
                });
                
                this.app.fabricCanvas.renderAll();
            });
        }
        
        // Direção da carga
        const directionSelect = document.getElementById('load-direction') || 
                               document.getElementById('dist-direction');
        
        if (directionSelect) {
            directionSelect.addEventListener('change', (e) => {
                element.direction = e.target.value;
                
                // Inverter setas se necessário
                if (element._objects) {
                    const arrow = element._objects.find(o => o.type === 'triangle');
                    if (arrow) {
                        arrow.set('angle', e.target.value === 'up' ? 0 : 180);
                        element.dirty = true;
                        this.app.fabricCanvas.renderAll();
                    }
                }
            });
        }
        
        // Botão de deletar
        const deleteBtn = document.getElementById('delete-element');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.app.canvasManager.removeObject(element);
                this.clear();
                this.app.fabricCanvas.discardActiveObject();
            });
        }
    }
    
    clear() {
        this.panel.innerHTML = '<p>Selecione um elemento para editar suas propriedades.</p>';
    }
}
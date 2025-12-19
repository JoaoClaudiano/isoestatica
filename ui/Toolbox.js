// CAIXA DE FERRAMENTAS
class Toolbox {
    constructor(app) {
        this.app = app;
        this.tools = [
            {
                id: 'select',
                name: 'Selecionar',
                icon: 'fas fa-mouse-pointer',
                description: 'Selecionar e mover elementos'
            },
            {
                id: 'support_fixed',
                name: 'Apoio Fixo',
                icon: 'fas fa-grip-lines-vertical',
                description: 'Apoio que restringe translação e rotação'
            },
            {
                id: 'support_movable',
                name: 'Apoio Móvel',
                icon: 'fas fa-circle',
                description: 'Apoio que restringe apenas translação vertical'
            },
            {
                id: 'load_concentrated',
                name: 'Carga Conc.',
                icon: 'fas fa-arrow-down',
                description: 'Carga concentrada em um ponto'
            },
            {
                id: 'load_distributed',
                name: 'Carga Dist.',
                icon: 'fas fa-arrows-alt-h',
                description: 'Carga distribuída por comprimento'
            },
            {
                id: 'moment',
                name: 'Momento',
                icon: 'fas fa-redo',
                description: 'Momento fletor aplicado'
            }
        ];
        
        this.render();
    }
    
    render() {
        const toolbox = document.getElementById('toolbox');
        toolbox.innerHTML = '';
        
        this.tools.forEach(tool => {
            const toolBtn = document.createElement('button');
            toolBtn.className = `tool-btn ${tool.id === 'select' ? 'active' : ''}`;
            toolBtn.innerHTML = `
                <i class="${tool.icon}"></i>
                <span>${tool.name}</span>
            `;
            
            toolBtn.title = tool.description;
            toolBtn.addEventListener('click', (e) => {
                this.app.setActiveTool(tool.id);
                this.setActiveButton(toolBtn);
            });
            
            toolbox.appendChild(toolBtn);
        });
    }
    
    setActiveButton(activeBtn) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    getActiveTool() {
        return this.app.state.activeTool;
    }
}
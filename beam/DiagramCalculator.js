// CALCULADORA DE DIAGRAMAS
class DiagramCalculator {
    constructor() {
        this.precision = 0.001;
    }
    
    calculateShearDiagram(beamData, reactions) {
        const points = [];
        const step = beamData.length / 100;
        
        let currentShear = 0;
        
        for (let x = 0; x <= beamData.length + this.precision; x += step) {
            // Reiniciar cortante para cada posição
            currentShear = 0;
            
            // Adicionar reações
            reactions.forEach(r => {
                if (r.position <= x) {
                    currentShear += r.value;
                }
            });
            
            // Subtrair cargas
            beamData.elements.forEach(element => {
                if (element.position <= x) {
                    if (element.type === 'load_concentrated') {
                        const force = element.direction === 'up' ? element.value : -element.value;
                        currentShear += force;
                    } else if (element.type === 'load_distributed') {
                        const start = element.position;
                        const end = start + (element.length || 0);
                        const w = element.value;
                        
                        if (x >= start) {
                            const effectiveX = Math.min(x, end);
                            const force = w * (effectiveX - start);
                            currentShear += (element.direction === 'up' ? force : -force);
                        }
                    }
                }
            });
            
            points.push({
                x: parseFloat(x.toFixed(3)),
                y: parseFloat(currentShear.toFixed(3))
            });
        }
        
        return points;
    }
    
    calculateMomentDiagram(beamData, shearPoints) {
        const points = [];
        let currentMoment = 0;
        
        for (let i = 1; i < shearPoints.length; i++) {
            const dx = shearPoints[i].x - shearPoints[i-1].x;
            const avgShear = (shearPoints[i-1].y + shearPoints[i].y) / 2;
            
            // Área sob a curva do cortante = momento
            currentMoment += avgShear * dx;
            
            points.push({
                x: shearPoints[i].x,
                y: parseFloat(currentMoment.toFixed(3))
            });
        }
        
        return points;
    }
    
    calculateNormalDiagram(beamData) {
        // Para cargas verticais, força normal é zero
        const points = [];
        const step = beamData.length / 100;
        
        for (let x = 0; x <= beamData.length; x += step) {
            points.push({
                x: parseFloat(x.toFixed(3)),
                y: 0
            });
        }
        
        return points;
    }
    
    findCriticalPoints(points) {
        if (points.length === 0) return { max: 0, min: 0 };
        
        let max = points[0].y;
        let min = points[0].y;
        let maxX = points[0].x;
        let minX = points[0].x;
        
        points.forEach(point => {
            if (point.y > max) {
                max = point.y;
                maxX = point.x;
            }
            if (point.y < min) {
                min = point.y;
                minX = point.x;
            }
        });
        
        return {
            max: { value: max, position: maxX },
            min: { value: min, position: minX }
        };
    }
}
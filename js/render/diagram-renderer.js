// Renderizador específico para diagramas
class DiagramRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.diagramScale = 0.15; // Escala dos diagramas
        this.diagramOffset = 0.3; // Offset da barra
        this.fillOpacity = 0.3; // Opacidade do preenchimento
    }

    // Desenhar diagrama de esforço normal
    drawNormalDiagram(beam, normalForces, color = '#3498db') {
        if (!normalForces || normalForces.length < 2) return;
        
        const points = this.calculateDiagramPoints(beam, normalForces);
        this.drawDiagramLine(points, color, 2);
        this.fillDiagramArea(beam, points, color);
        this.drawDiagramLabels(beam, normalForces, color, 'N');
    }

    // Desenhar diagrama de esforço cortante
    drawShearDiagram(beam, shearForces, color = '#2ecc71') {
        if (!shearForces || shearForces.length < 2) return;
        
        const points = this.calculateDiagramPoints(beam, shearForces);
        this.drawDiagramLine(points, color, 2);
        this.fillDiagramArea(beam, points, color);
        this.drawDiagramLabels(beam, shearForces, color, 'V');
        this.drawZeroCrossings(beam, shearForces, color);
    }

    // Desenhar diagrama de momento fletor
    drawMomentDiagram(beam, momentForces, color = '#e74c3c') {
        if (!momentForces || momentForces.length < 2) return;
        
        const points = this.calculateDiagramPoints(beam, momentForces);
        this.drawDiagramLine(points, color, 2);
        this.fillDiagramArea(beam, points, color);
        this.drawDiagramLabels(beam, momentForces, color, 'M');
        this.drawExtremePoints(beam, momentForces, color);
    }

    // Desenhar diagrama de momento torçor
    drawTorsionDiagram(beam, torsionForces, color = '#9b59b6') {
        if (!torsionForces || torsionForces.length < 2) return;
        
        const points = this.calculateDiagramPoints(beam, torsionForces);
        this.drawDiagramLine(points, color, 2, [5, 3]);
        this.fillDiagramArea(beam, points, color);
        this.drawDiagramLabels(beam, torsionForces, color, 'T');
    }

    // Calcular pontos do diagrama
    calculateDiagramPoints(beam, forces) {
        const points = [];
        const normalAngle = beam.angle + Math.PI / 2; // Perpendicular à barra
        
        forces.forEach(force => {
            const t = force.x;
            const value = force.value * this.diagramScale * this.renderer.scale;
            
            // Posição na barra
            const x = beam.start.x + t * (beam.end.x - beam.start.x);
            const y = beam.start.y + t * (beam.end.y - beam.start.y);
            
            // Offset do diagrama
            const offset = this.diagramOffset * this.renderer.scale;
            const offsetX = offset * Math.cos(normalAngle);
            const offsetY = offset * Math.sin(normalAngle);
            
            // Valor do diagrama
            const diagramX = value * Math.cos(normalAngle);
            const diagramY = value * Math.sin(normalAngle);
            
            const screenPos = this.renderer.worldToScreen(
                x + offsetX + diagramX,
                y + offsetY + diagramY
            );
            
            points.push(screenPos);
        });
        
        return points;
    }

    // Desenhar linha do diagrama
    drawDiagramLine(points, color, lineWidth = 2, dashPattern = []) {
        if (points.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (dashPattern.length > 0) {
            this.ctx.setLineDash(dashPattern);
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    // Preencher área do diagrama
    fillDiagramArea(beam, points, color) {
        if (points.length < 2) return;
        
        // Pontos base na barra (deslocados)
        const normalAngle = beam.angle + Math.PI / 2;
        const offset = this.diagramOffset * this.renderer.scale;
        
        const startBase = this.renderer.worldToScreen(
            beam.start.x + offset * Math.cos(normalAngle),
            beam.start.y + offset * Math.sin(normalAngle)
        );
        
        const endBase = this.renderer.worldToScreen(
            beam.end.x + offset * Math.cos(normalAngle),
            beam.end.y + offset * Math.sin(normalAngle)
        );
        
        this.ctx.save();
        this.ctx.fillStyle = this.hexToRgba(color, this.fillOpacity);
        
        this.ctx.beginPath();
        this.ctx.moveTo(startBase.x, startBase.y);
        
        // Linha superior (diagrama)
        points.forEach(point => {
            this.ctx.lineTo(point.x, point.y);
        });
        
        // Linha de volta pela base
        this.ctx.lineTo(endBase.x, endBase.y);
        this.ctx.lineTo(startBase.x, startBase.y);
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }

    // Desenhar rótulos nos diagramas
    drawDiagramLabels(beam, forces, color, label) {
        if (!this.renderer.showValues) return;
        
        const normalAngle = beam.angle + Math.PI / 2;
        const offset = (this.diagramOffset + 0.1) * this.renderer.scale;
        
        // Mostrar valores nos extremos e no meio
        const keyPoints = [0, 0.25, 0.5, 0.75, 1];
        
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        keyPoints.forEach(t => {
            // Encontrar força mais próxima
            const index = Math.round(t * (forces.length - 1));
            const force = forces[index];
            if (!force) return;
            
            const value = force.value;
            if (Math.abs(value) < 0.01) return; // Ignorar valores muito pequenos
            
            // Posição na barra
            const x = beam.start.x + t * (beam.end.x - beam.start.x);
            const y = beam.start.y + t * (beam.end.y - beam.start.y);
            
            // Offset para o rótulo
            const offsetX = offset * Math.cos(normalAngle);
            const offsetY = offset * Math.sin(normalAngle);
            
            const screenPos = this.renderer.worldToScreen(x + offsetX, y + offsetY);
            
            // Desenhar linha de conexão
            const diagramPos = this.calculateDiagramPoints(beam, [force])[0];
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(diagramPos.x, diagramPos.y);
            this.ctx.lineTo(screenPos.x, screenPos.y);
            this.ctx.stroke();
            
            // Fundo para legibilidade
            const text = `${value.toFixed(1)} ${label}`;
            const textWidth = this.ctx.measureText(text).width;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(
                screenPos.x - textWidth/2 - 3,
                screenPos.y - 8,
                textWidth + 6,
                16
            );
            
            // Texto
            this.ctx.fillStyle = color;
            this.ctx.fillText(text, screenPos.x, screenPos.y);
        });
        
        this.ctx.restore();
    }

    // Desenhar pontos de cruzamento por zero
    drawZeroCrossings(beam, forces, color) {
        const zeroPoints = this.findZeroCrossings(forces);
        if (zeroPoints.length === 0) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2;
        
        zeroPoints.forEach(t => {
            // Posição na barra
            const x = beam.start.x + t * (beam.end.x - beam.start.x);
            const y = beam.start.y + t * (beam.end.y - beam.start.y);
            
            const screenPos = this.renderer.worldToScreen(x, y);
            
            // Marcar ponto
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Anel
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 6, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Rótulo
            this.ctx.fillStyle = color;
            this.ctx.font = '9px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText('V=0', screenPos.x, screenPos.y - 8);
        });
        
        this.ctx.restore();
    }

    // Desenhar pontos extremos
    drawExtremePoints(beam, forces, color) {
        const extremes = this.findExtremes(forces);
        if (!extremes.max && !extremes.min) return;
        
        this.ctx.save();
        
        [extremes.max, extremes.min].forEach(extreme => {
            if (!extreme) return;
            
            const t = extreme.t;
            const x = beam.start.x + t * (beam.end.x - beam.start.x);
            const y = beam.start.y + t * (beam.end.y - beam.start.y);
            
            const screenPos = this.renderer.worldToScreen(x, y);
            
            // Desenhar ponto
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rótulo
            this.ctx.fillStyle = color;
            this.ctx.font = '9px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`M=${extreme.value.toFixed(1)}`, screenPos.x, screenPos.y + 8);
        });
        
        this.ctx.restore();
    }

    // Encontrar cruzamentos por zero
    findZeroCrossings(forces) {
        const crossings = [];
        
        for (let i = 0; i < forces.length - 1; i++) {
            const current = forces[i];
            const next = forces[i + 1];
            
            // Verificar se há mudança de sinal
            if (current.value * next.value <= 0) {
                // Interpolar posição exata do zero
                const t = current.x + (0 - current.value) * (next.x - current.x) / (next.value - current.value);
                crossings.push(t);
            }
        }
        
        return crossings;
    }

    // Encontrar valores extremos
    findExtremes(forces) {
        let max = { value: -Infinity, t: 0 };
        let min = { value: Infinity, t: 0 };
        
        forces.forEach(force => {
            if (force.value > max.value) {
                max.value = force.value;
                max.t = force.x;
            }
            if (force.value < min.value) {
                min.value = force.value;
                min.t = force.x;
            }
        });
        
        return { max: max.value > -Infinity ? max : null, min: min.value < Infinity ? min : null };
    }

    // Converter hex para rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Desenhar seta indicando direção
    drawArrow(x, y, angle, size = 10, color = '#000000') {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.fillStyle = color;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size, -size/2);
        this.ctx.lineTo(-size, size/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    // Desenhar convenção de sinais
    drawSignConvention(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Cortante positivo
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(30, 0);
        this.ctx.stroke();
        
        this.drawArrow(15, 0, Math.PI/2, 8, '#2ecc71');
        
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('V+', 35, 0);
        
        // Momento positivo
        this.ctx.translate(60, 0);
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, -Math.PI/4, Math.PI/4);
        this.ctx.stroke();
        
        this.drawArrow(10 * Math.cos(Math.PI/4), 10 * Math.sin(Math.PI/4), Math.PI/4, 6, '#e74c3c');
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillText('M+', 20, 0);
        
        this.ctx.restore();
    }
}

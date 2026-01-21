// Utilitários para o Isostática Lab
class Utils {
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    static formatNumber(value, decimals = 2, unit = '') {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        return `${value.toFixed(decimals)} ${unit}`.trim();
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    static angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static linearInterpolate(x, x1, x2, y1, y2) {
        return y1 + (x - x1) * (y2 - y1) / (x2 - x1);
    }

    static solveLinearSystem(A, B) {
        // Resolve sistema linear Ax = B para 3x3 (reações)
        const n = 3;
        const aug = A.map((row, i) => [...row, B[i]]);
        
        // Eliminação gaussiana
        for (let i = 0; i < n; i++) {
            // Pivô
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(aug[j][i]) > Math.abs(aug[maxRow][i])) {
                    maxRow = j;
                }
            }
            
            // Trocar linhas
            [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
            
            // Eliminar abaixo
            for (let j = i + 1; j < n; j++) {
                const factor = aug[j][i] / aug[i][i];
                for (let k = i; k <= n; k++) {
                    aug[j][k] -= factor * aug[i][k];
                }
            }
        }
        
        // Substituição retroativa
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += aug[i][j] * x[j];
            }
            x[i] = (aug[i][n] - sum) / aug[i][i];
        }
        
        return x;
    }

    static calculateCentroid(points) {
        const n = points.length;
        let sumX = 0, sumY = 0;
        points.forEach(p => {
            sumX += p.x;
            sumY += p.y;
        });
        return { x: sumX / n, y: sumY / n };
    }

    static calculatePolygonArea(points) {
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return Math.abs(area) / 2;
    }

    static isPointInPolygon(point, polygon) {
        let inside = false;
        const n = polygon.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        return inside;
    }

    static snapToGrid(value, gridSize) {
        return Math.round(value / gridSize) * gridSize;
    }

    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static parseUnits(value) {
        if (typeof value === 'string') {
            if (value.endsWith('kN')) return parseFloat(value) * 1000;
            if (value.endsWith('N')) return parseFloat(value);
            if (value.endsWith('m')) return parseFloat(value);
        }
        return parseFloat(value);
    }

    static formatUnits(value, type) {
        if (type === 'force') {
            if (Math.abs(value) >= 1000) return `${(value/1000).toFixed(2)} kN`;
            return `${value.toFixed(2)} N`;
        }
        if (type === 'length') {
            return `${value.toFixed(2)} m`;
        }
        if (type === 'moment') {
            if (Math.abs(value) >= 1000) return `${(value/1000).toFixed(2)} kN.m`;
            return `${value.toFixed(2)} N.m`;
        }
        return value.toFixed(2);
    }

    static validateStructure(structure) {
        const errors = [];
        
        // Verificar nós
        if (structure.nodes.length === 0) {
            errors.push("A estrutura não possui nós");
        }
        
        // Verificar barras
        structure.beams.forEach(beam => {
            if (beam.start === beam.end) {
                errors.push(`Barra ${beam.id} tem início e fim no mesmo nó`);
            }
        });
        
        // Verificar apoios
        const supports = structure.nodes.filter(n => n.support).length;
        if (supports === 0) {
            errors.push("A estrutura não possui apoios");
        }
        
        return errors;
    }
}

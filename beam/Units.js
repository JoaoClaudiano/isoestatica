// CONVERSOR DE UNIDADES
class Units {
    constructor() {
        this.conversions = {
            // Para kN (mantido como base)
            kN: {
                N: 1000,
                kgf: 101.9716,
                kN: 1
            },
            // Para N
            N: {
                kN: 0.001,
                kgf: 0.1019716,
                N: 1
            },
            // Para kgf
            kgf: {
                kN: 0.00980665,
                N: 9.80665,
                kgf: 1
            }
        };
        
        this.symbols = {
            kN: 'kN',
            N: 'N',
            kgf: 'kgf'
        };
    }
    
    convert(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        
        if (!this.conversions[fromUnit] || !this.conversions[fromUnit][toUnit]) {
            throw new Error(`Conversão não suportada: ${fromUnit} para ${toUnit}`);
        }
        
        return value * this.conversions[fromUnit][toUnit];
    }
    
    convertMoment(value, fromUnit, toUnit) {
        // Conversão de momento (unidade * comprimento)
        return this.convert(value, fromUnit, toUnit);
    }
    
    getSymbol(unit) {
        return this.symbols[unit] || unit;
    }
    
    getMomentSymbol(unit) {
        return `${this.getSymbol(unit)}.m`;
    }
    
    format(value, unit, decimals = 2) {
        return `${value.toFixed(decimals)} ${this.getSymbol(unit)}`;
    }
    
    formatMoment(value, unit, decimals = 2) {
        return `${value.toFixed(decimals)} ${this.getMomentSymbol(unit)}`;
    }
}
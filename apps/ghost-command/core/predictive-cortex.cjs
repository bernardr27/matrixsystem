const os = require('os');
const { createClient } = require('@supabase/supabase-js');

class PredictiveCortex {
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
        this.historicalData = [];
        this.predictions = [];
        this.patterns = [];
    }

    async collect() {
        // Collect current metrics
        const metrics = {
            timestamp: Date.now(),
            ramPercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
            cpuLoad: os.loadavg()[0].toFixed(2),
            uptime: process.uptime()
        };

        this.historicalData.push(metrics);

        // Keep last 1000 data points (approx 2 hours at 2min intervals)
        if (this.historicalData.length > 1000) {
            this.historicalData.shift();
        }

        return metrics;
    }

    analyze() {
        if (this.historicalData.length < 10) {
            console.log('[ORACLE] Insufficient data for prediction (need 10+ samples)');
            return null;
        }

        const recent = this.historicalData.slice(-10);
        const predictions = this.predictTrends(recent);

        // Detect anomalies
        const anomalies = this.detectAnomalies(recent);

        // Pattern matching
        const patterns = this.detectPatterns();

        return {
            predictions,
            anomalies,
            patterns,
            confidence: this.calculateConfidence()
        };
    }

    predictTrends(recent) {
        // Simple linear regression for next 10 minutes
        const ramTrend = this.calculateTrend(recent.map(m => parseFloat(m.ramPercent)));
        const cpuTrend = this.calculateTrend(recent.map(m => parseFloat(m.cpuLoad)));

        const predictions = {
            ram: {
                current: parseFloat(recent[recent.length - 1].ramPercent),
                predicted10min: ramTrend.predict(10),
                trend: ramTrend.slope > 0.5 ? 'rising' : ramTrend.slope < -0.5 ? 'falling' : 'stable'
            },
            cpu: {
                current: parseFloat(recent[recent.length - 1].cpuLoad),
                predicted10min: cpuTrend.predict(10),
                trend: cpuTrend.slope > 0.1 ? 'rising' : cpuTrend.slope < -0.1 ? 'falling' : 'stable'
            }
        };

        // Generate alerts if predictions cross thresholds
        const alerts = [];
        if (predictions.ram.predicted10min > 90) {
            alerts.push({
                type: 'warning',
                severity: 'high',
                message: `RAM predicted to reach ${predictions.ram.predicted10min.toFixed(1)}% in 10 minutes`,
                recommendation: 'Consider preemptive memory cleanup'
            });
        }

        if (predictions.cpu.predicted10min > 3) {
            alerts.push({
                type: 'warning',
                severity: 'medium',
                message: `CPU load predicted to reach ${predictions.cpu.predicted10min.toFixed(2)} in 10 minutes`,
                recommendation: 'Monitor for runaway processes'
            });
        }

        return { ...predictions, alerts };
    }

    calculateTrend(values) {
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return {
            slope,
            intercept,
            predict: (steps) => intercept + slope * (n + steps)
        };
    }

    detectAnomalies(recent) {
        const anomalies = [];

        // Calculate average and standard deviation
        const ramValues = recent.map(m => parseFloat(m.ramPercent));
        const cpuValues = recent.map(m => parseFloat(m.cpuLoad));

        const ramAvg = ramValues.reduce((a, b) => a + b) / ramValues.length;
        const cpuAvg = cpuValues.reduce((a, b) => a + b) / cpuValues.length;

        const ramStd = Math.sqrt(ramValues.reduce((sum, val) => sum + Math.pow(val - ramAvg, 2), 0) / ramValues.length);
        const cpuStd = Math.sqrt(cpuValues.reduce((sum, val) => sum + Math.pow(val - cpuAvg, 2), 0) / cpuValues.length);

        // Check for sudden spikes (>2 std deviations)
        const currentRam = ramValues[ramValues.length - 1];
        const currentCpu = cpuValues[cpuValues.length - 1];

        if (Math.abs(currentRam - ramAvg) > 2 * ramStd) {
            anomalies.push({
                type: 'spike',
                metric: 'ram',
                value: currentRam,
                expected: ramAvg.toFixed(1),
                deviation: ((currentRam - ramAvg) / ramStd).toFixed(1)
            });
        }

        if (Math.abs(currentCpu - cpuAvg) > 2 * cpuStd) {
            anomalies.push({
                type: 'spike',
                metric: 'cpu',
                value: currentCpu,
                expected: cpuAvg.toFixed(2),
                deviation: ((currentCpu - cpuAvg) / cpuStd).toFixed(1)
            });
        }

        return anomalies;
    }

    detectPatterns() {
        // Look for recurring events (e.g., daily spikes at same time)
        // This would require timestamp analysis across days
        // For now, return placeholder
        return [];
    }

    calculateConfidence() {
        // Confidence based on data points and variance
        const dataPoints = this.historicalData.length;
        if (dataPoints < 10) return 0.3;
        if (dataPoints < 50) return 0.6;
        if (dataPoints < 200) return 0.8;
        return 0.9;
    }

    async broadcastPrediction(analysis) {
        if (!analysis || !analysis.predictions.alerts || analysis.predictions.alerts.length === 0) {
            return;
        }

        for (const alert of analysis.predictions.alerts) {
            await this.supabase.from('ghost_bridge').insert({
                command: 'sys:broadcast',
                source: 'predictive_cortex',
                status: 'alert',
                output: JSON.stringify({
                    id: crypto.randomUUID(),
                    title: `PREDICTION: ${alert.type.toUpperCase()}`,
                    message: alert.message,
                    recommendation: alert.recommendation,
                    type: 'prediction',
                    severity: alert.severity,
                    timestamp: Date.now()
                })
            });
        }

        console.log(`[ORACLE] 🔮 Generated ${analysis.predictions.alerts.length} predictive alert(s)`);
    }

    getStatus() {
        return {
            dataPoints: this.historicalData.length,
            lastAnalysis: this.predictions,
            patterns: this.patterns,
            confidence: this.calculateConfidence()
        };
    }
}

module.exports = PredictiveCortex;

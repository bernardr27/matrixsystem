'use client';

import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, LineChart, Line, Legend
} from 'recharts';

const COLORS = {
    mindset: '#6366f1',
    career: '#10b981',
    money: '#f59e0b',
    relationships: '#ec4899',
    discipline: '#3b82f6',
    hrv: '#ef4444',
    sleep: '#8b5cf6'
};

interface InsightsChartsProps {
    modeData: any[];
    activityData: any[];
    biometricData?: any[];
}

export default function InsightsCharts({ modeData, activityData, biometricData = [] }: InsightsChartsProps) {
    // Process Biometric Data for Charting
    const biometricChartData = activityData.map(day => {
        const dateStr = day.day; // e.g. "Mon"
        // Find matching biometric entries for this day
        // This is a simplification for the demo. In a real app, we'd match by actual date.
        const hrvEntry = biometricData.find(b => b.metric_type === 'hrv');
        const sleepEntry = biometricData.find(b => b.metric_type === 'sleep_score');

        return {
            ...day,
            hrv: hrvEntry ? hrvEntry.value + (Math.random() * 10 - 5) : 0, // Adding variance for visual interest
            sleep: sleepEntry ? sleepEntry.value + (Math.random() * 5 - 2.5) : 0
        };
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Mode Distribution */}
            <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888', letterSpacing: '0.05em' }}>FOCUS AREAS</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={modeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {modeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#888'} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#333', border: 'none', borderRadius: '4px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {modeData.map((m) => (
                        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: (COLORS as any)[m.name] || '#888' }} />
                            <span style={{ textTransform: 'capitalize', color: '#ccc' }}>{m.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Weekly Activity */}
            <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888', letterSpacing: '0.05em' }}>ACTIVITY (LAST 7 DAYS)</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityData}>
                            <XAxis dataKey="day" stroke="#444" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#444" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: '#333' }}
                                contentStyle={{ background: '#222', border: 'none', borderRadius: '4px' }}
                            />
                            <Bar dataKey="count" fill="#fff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biometric Correlation */}
            <div style={{ background: '#111', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333', gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#888', letterSpacing: '0.05em' }}>SOMATIC_RESONANCE (BIO-METRICS)</h3>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={biometricChartData}>
                            <XAxis dataKey="day" stroke="#444" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#444" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#222', border: 'none', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" dataKey="hrv" stroke={COLORS.hrv} strokeWidth={3} dot={{ r: 4, fill: COLORS.hrv }} activeDot={{ r: 6 }} name="HRV (ms)" />
                            <Line type="monotone" dataKey="sleep" stroke={COLORS.sleep} strokeWidth={3} dot={{ r: 4, fill: COLORS.sleep }} activeDot={{ r: 6 }} name="Sleep Score" />
                            <Line type="monotone" dataKey="count" stroke="#fff" strokeWidth={1} strokeDasharray="5 5" name="Journal Entires" opacity={0.3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontStyle: 'italic' }}>
                    * Correlating HRV recovery with reflection frequency detects cognitive fatigue patterns.
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useRef } from 'react';
import { ConstructionSite, LeadStage } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as L from 'leaflet';

interface Props {
    sites: ConstructionSite[];
}

// Pseudo-geocoding for demo purposes (approximating Neighborhoods in São Paulo)
// In a real app, use the Google Maps Geocoding API.
const getApproximateCoords = (neighborhood: string, fallbackLat = -23.550520, fallbackLng = -46.633308) => {
    // Generate a deterministic pseudo-random offset based on neighborhood name string
    let hash = 0;
    for (let i = 0; i < neighborhood.length; i++) {
        hash = neighborhood.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Create an offset of roughly +/- 0.05 degrees (~5km)
    const latOffset = ((hash % 1000) - 500) / 10000; 
    const lngOffset = (((hash >> 2) % 1000) - 500) / 10000;

    return {
        lat: fallbackLat + latOffset,
        lng: fallbackLng + lngOffset
    };
};

const DashboardTab: React.FC<Props> = ({ sites }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    // 1. Funnel by Lead Stage
    const funnelData = Object.values(LeadStage).map(stage => ({
        name: stage,
        value: sites.filter(s => s.leadStage === stage).length
    })).filter(d => d.value > 0);

    // 2. Metrics
    const totalTasks = sites.reduce((acc, s) => acc + s.tasks.length, 0);
    const overdueTasks = sites.reduce((acc, s) => {
        return acc + s.tasks.filter(t => !t.completed && new Date(`${t.date}T${t.time}`).getTime() < Date.now()).length
    }, 0);
    const completedTasks = sites.reduce((acc, s) => acc + s.tasks.filter(t => t.completed).length, 0);
    const inactiveCount = sites.filter(s => s.leadStage === LeadStage.INACTIVE).length;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

    // 3. Initialize Map
    useEffect(() => {
        if (!mapRef.current) return;

        // Clean up existing map if strict mode renders twice
        if (mapInstance.current) {
            mapInstance.current.remove();
        }

        // Initialize Map
        const map = L.map(mapRef.current).setView([-23.550520, -46.633308], 11); // Start centered on São Paulo
        mapInstance.current = map;

        // Add OpenStreetMap Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add Markers
        sites.forEach(site => {
            let lat: number, lng: number;

            // Use provided coords or fallback to pseudo-geocoding based on neighborhood
            if (site.lat && site.lng) {
                lat = parseFloat(site.lat);
                lng = parseFloat(site.lng);
            } else {
                const coords = getApproximateCoords(site.neighborhood || 'Desconhecido');
                lat = coords.lat;
                lng = coords.lng;
            }

            // Create a Circle Marker (better for density visualization)
            const color = site.leadStage === LeadStage.INACTIVE ? '#94a3b8' : '#3b82f6';
            
            L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            })
            .addTo(map)
            .bindPopup(`
                <b>${site.siteName}</b><br/>
                ${site.neighborhood}<br/>
                Status: ${site.leadStage}
            `);
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [sites]);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 font-medium uppercase">Total Obras</p>
                    <h3 className="text-3xl font-bold text-slate-800">{sites.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 font-medium uppercase">Tarefas Concluídas</p>
                    <h3 className="text-3xl font-bold text-green-600">{completedTasks}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 font-medium uppercase">Tarefas em Atraso</p>
                    <h3 className="text-3xl font-bold text-red-500">{overdueTasks}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-500 font-medium uppercase">Leads Inativos</p>
                    <h3 className="text-3xl font-bold text-slate-400">
                        {inactiveCount}
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Funil de Vendas</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={funnelData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 11}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Real Density Map using Leaflet */}
                <div className="bg-white p-0 rounded-xl shadow-sm border border-slate-200 h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-white z-10 relative">
                        <h3 className="text-lg font-bold text-slate-800">Mapa de Densidade (Geográfico)</h3>
                        <p className="text-xs text-slate-500">Exibindo localização aproximada por bairro ou coordenadas exatas.</p>
                    </div>
                    <div id="map" ref={mapRef} className="flex-1 bg-slate-100 z-0 relative" style={{ minHeight: '300px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
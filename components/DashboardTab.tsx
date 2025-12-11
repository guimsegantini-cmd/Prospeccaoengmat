import React, { useEffect, useRef, useState } from 'react';
import { ConstructionSite, LeadStage } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as L from 'leaflet';
import { MapPin } from 'lucide-react';

interface Props {
    sites: ConstructionSite[];
}

interface SiteLocation {
    lat: number;
    lng: number;
    site: ConstructionSite;
}

const DashboardTab: React.FC<Props> = ({ sites }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const [locations, setLocations] = useState<SiteLocation[]>([]);
    const [loadingMap, setLoadingMap] = useState(false);

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

    // 3. Geocoding Logic
    useEffect(() => {
        let isMounted = true;
        const processSites = async () => {
            setLoadingMap(true);
            const resolvedLocations: SiteLocation[] = [];

            // We need to fetch coordinates for sites that don't have them explicitly set
            // We use OpenStreetMap Nominatim API (Free, requires user agent)
            // Note: In a real heavy-use app, you should cache these in the backend.
            
            for (const site of sites) {
                if (!isMounted) break;

                // Case A: Lat/Lng exists in DB
                if (site.lat && site.lng) {
                    const lat = parseFloat(site.lat);
                    const lng = parseFloat(site.lng);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        resolvedLocations.push({ lat, lng, site });
                        continue;
                    }
                }

                // Case B: Geocode via Address
                // To be polite to the API, we only fetch if we have an address and we add a small delay
                if (site.address) {
                    try {
                        const query = `${site.address}, ${site.neighborhood || ''}`;
                        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
                        
                        // Simple throttle/delay
                        await new Promise(r => setTimeout(r, 800)); 

                        const res = await fetch(url, { headers: { 'User-Agent': 'ProspeccaoEngmat/1.0' } });
                        const data = await res.json();

                        if (data && data.length > 0) {
                            resolvedLocations.push({
                                lat: parseFloat(data[0].lat),
                                lng: parseFloat(data[0].lon),
                                site
                            });
                        }
                    } catch (e) {
                        console.warn("Geocoding failed for", site.siteName, e);
                    }
                }
            }

            if (isMounted) {
                setLocations(resolvedLocations);
                setLoadingMap(false);
            }
        };

        processSites();

        return () => { isMounted = false; };
    }, [sites]);

    // 4. Map Rendering
    useEffect(() => {
        if (!mapRef.current) return;

        // Clean up existing map
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }

        // Default Center (São Paulo) if no locations
        const initialCenter: [number, number] = locations.length > 0 
            ? [locations[0].lat, locations[0].lng] 
            : [-23.550520, -46.633308];

        const map = L.map(mapRef.current).setView(initialCenter, 12);
        mapInstance.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add Markers
        const markers = L.featureGroup();

        locations.forEach(loc => {
            const color = loc.site.leadStage === LeadStage.INACTIVE ? '#94a3b8' : '#3b82f6';
            
            const marker = L.circleMarker([loc.lat, loc.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            })
            .bindPopup(`
                <div style="font-family: sans-serif;">
                    <strong style="font-size: 14px; color: #1e293b;">${loc.site.siteName}</strong><br/>
                    <span style="font-size: 12px; color: #64748b;">${loc.site.builderName}</span><br/>
                    <span style="font-size: 11px; color: #64748b;">${loc.site.address}</span><br/>
                    <span style="display:inline-block; margin-top:4px; padding: 2px 6px; background: #e2e8f0; border-radius: 4px; font-size: 10px; font-weight: bold;">
                        ${loc.site.phase}
                    </span>
                </div>
            `);
            
            marker.addTo(map);
            markers.addLayer(marker);
        });

        if (locations.length > 0) {
            map.fitBounds(markers.getBounds(), { padding: [50, 50] });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [locations]);

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

                {/* Real Map */}
                <div className="bg-white p-0 rounded-xl shadow-sm border border-slate-200 h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-white z-10 relative flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Mapa de Obras</h3>
                            <p className="text-xs text-slate-500">
                                {loadingMap 
                                    ? "Buscando coordenadas dos endereços..." 
                                    : "Localização baseada no endereço cadastrado."}
                            </p>
                        </div>
                        {loadingMap && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                    </div>
                    <div id="map" ref={mapRef} className="flex-1 bg-slate-100 z-0 relative" style={{ minHeight: '300px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;

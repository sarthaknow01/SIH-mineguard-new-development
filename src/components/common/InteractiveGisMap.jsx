import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, AlertTriangle, ShieldCheck, Filter, Layers, Info } from 'lucide-react';

// DEMO Coalfield Centroid Coordinates (Explicitly marked as Demo Centroids)
const DEMO_MINE_COORDINATES = {
  'MINE-01': { lat: 23.7957, lng: 86.4304, label: 'Dhanbad Coalfield, Jharkhand' },
  'MINE-02': { lat: 23.6186, lng: 87.1278, label: 'Raniganj Basin, West Bengal' },
  'MINE-03': { lat: 24.1997, lng: 82.6644, label: 'Singrauli Coal Belt, Madhya Pradesh' },
  'MINE-04': { lat: 22.3595, lng: 82.7501, label: 'Korba Industrial Belt, Chhattisgarh' },
  'MINE-05': { lat: 20.9500, lng: 85.2333, label: 'Talcher Coalfields, Odisha' },
};

export default function InteractiveGisMap({ initialMineFilter = 'ALL' }) {
  const { mines, inspections, violations } = useData();
  const { currentUser } = useAuth();
  
  const userRole = currentUser?.role || 'INSPECTOR';
  const userMineId = currentUser?.mineId || null;

  // Mine Access Authorization Check: Single-mine roles restricted to assigned mine
  const isRestrictedRole = (userRole === 'INSPECTOR' || userRole === 'OFFICER') && userMineId;

  const [selectedMine, setSelectedMine] = useState(isRestrictedRole ? userMineId : initialMineFilter);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Central India
    const map = L.map(mapContainerRef.current, {
      center: [22.5000, 83.5000],
      zoom: 6,
      zoomControl: true,
    });

    // Dark-themed tile layer matching MineGuard aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Markers on Data / Filter Changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. Authorized Mines Filtering
    const visibleMines = mines.filter(m => {
      if (isRestrictedRole) return m.mineId === userMineId;
      if (selectedMine !== 'ALL') return m.mineId === selectedMine;
      return true;
    });

    // 2. Authorized Geo-Tagged Inspections Filtering
    const visibleInspections = inspections.filter(i => {
      if (i.latitude === null || i.longitude === null) return false;
      if (isRestrictedRole) return i.mineId === userMineId;
      if (selectedMine !== 'ALL') return i.mineId === selectedMine;
      return true;
    });

    // 3. Authorized Geo-Tagged Violations Filtering
    const visibleViolations = violations.filter(v => {
      if (v.latitude === null || v.longitude === null) return false;
      if (isRestrictedRole) return v.mineId === userMineId;
      if (selectedMine !== 'ALL' && v.mineId !== selectedMine) return false;
      if (selectedSeverity !== 'ALL' && v.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'ALL' && v.status !== selectedStatus) return false;
      return true;
    });

    // Render Mine HQ Centroid Markers
    visibleMines.forEach(m => {
      const coords = DEMO_MINE_COORDINATES[m.mineId] || { lat: 22.5, lng: 83.5, label: m.location };
      
      const mineHtml = `
        <div style="background-color:#1e293b; color:#ffffff; border:2px solid #3b82f6; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(59,130,246,0.5); font-weight:bold; font-size:11px;">
          🏢
        </div>
      `;

      const icon = L.divIcon({
        className: 'mine-hq-icon',
        html: mineHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupContent = `
        <div style="font-family:sans-serif; color:#f8fafc; font-size:12px; line-height:1.4; padding:2px;">
          <div style="font-weight:bold; color:#60a5fa; font-size:13px;">${m.mineName} (${m.mineId})</div>
          <div style="color:#94a3b8; font-size:10px; margin-top:2px;">${m.location}</div>
          <div style="margin-top:6px; background:#0f172a; padding:6px; border-radius:6px; border:1px solid #334155;">
            <div>Compliance Score: <strong style="color:${m.complianceScore >= 80 ? '#34d399' : '#f87171'}">${m.complianceScore}%</strong></div>
            <div>Risk Level: <strong>${m.riskLevel}</strong></div>
            <div>Safety Officer: ${m.officer}</div>
          </div>
          <div style="font-size:9px; color:#94a3b8; margin-top:6px; font-style:italic;">📍 Demo Coalfield Region Centroid</div>
        </div>
      `;

      L.marker([coords.lat, coords.lng], { icon })
        .bindPopup(popupContent)
        .addTo(layerGroup);
    });

    // Render Geo-Tagged Inspection Markers
    visibleInspections.forEach(i => {
      const isPassed = i.overallResult === 'PASSED' || i.overallResult === 'COMPLETED';
      const color = isPassed ? '#10b981' : '#ef4444';

      const inspHtml = `
        <div style="background-color:${color}; color:#ffffff; border:2px solid #ffffff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px ${color}; font-size:10px;">
          📋
        </div>
      `;

      const icon = L.divIcon({
        className: 'inspection-marker-icon',
        html: inspHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const popupContent = `
        <div style="font-family:sans-serif; color:#f8fafc; font-size:11px; line-height:1.4;">
          <div style="font-weight:bold; color:#34d399;">📋 Field Inspection ${i.inspectionId}</div>
          <div>Mine: <strong>${i.mineName}</strong> (${i.area})</div>
          <div>Result: <strong style="color:${isPassed ? '#34d399' : '#f87171'}">${i.overallResult}</strong></div>
          <div>Inspector: ${i.inspectorName}</div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">GPS: ${Number(i.latitude).toFixed(4)}° N, ${Number(i.longitude).toFixed(4)}° E</div>
          <div style="font-size:9px; color:#64748b;">Timestamp: ${new Date(i.locationTimestamp || Date.now()).toLocaleString()}</div>
        </div>
      `;

      L.marker([Number(i.latitude), Number(i.longitude)], { icon })
        .bindPopup(popupContent)
        .addTo(layerGroup);
    });

    // Render Geo-Tagged Violation Hazard Pins
    visibleViolations.forEach(v => {
      let color = '#34d399';
      if (v.severity === 'CRITICAL') color = '#ef4444';
      else if (v.severity === 'HIGH') color = '#f97316';
      else if (v.severity === 'MEDIUM') color = '#eab308';

      const vioHtml = `
        <div style="background-color:${color}; color:#000000; border:2px solid #ffffff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px ${color}; font-weight:bold; font-size:12px; animation: pulse 2s infinite;">
          ⚠️
        </div>
      `;

      const icon = L.divIcon({
        className: 'violation-hazard-icon',
        html: vioHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupContent = `
        <div style="font-family:sans-serif; color:#f8fafc; font-size:11px; line-height:1.4;">
          <div style="font-weight:bold; color:${color};">⚠️ ${v.violationId} - ${v.category}</div>
          <div>Mine: <strong>${v.mineName}</strong> (${v.area})</div>
          <div>Severity: <strong style="color:${color}">${v.severity}</strong> • Status: <strong>${v.status}</strong></div>
          <div style="margin-top:4px; background:#0f172a; padding:4px 6px; border-radius:4px; border:1px solid #334155;">
            <div style="font-size:10px; color:#e2e8f0;">${v.description || 'Hazard reported during field safety audit.'}</div>
            <div style="font-size:10px; color:#a855f7; margin-top:2px;">AI Risk Score: ${v.riskScore}/100</div>
          </div>
          <div style="font-size:10px; color:#94a3b8; margin-top:4px;">GPS: ${Number(v.latitude).toFixed(4)}° N, ${Number(v.longitude).toFixed(4)}° E</div>
          <div style="font-size:9px; color:#64748b;">Reported Date: ${v.reportedDate || v.date}</div>
        </div>
      `;

      L.marker([Number(v.latitude), Number(v.longitude)], { icon })
        .bindPopup(popupContent)
        .addTo(layerGroup);
    });

  }, [mines, inspections, violations, selectedMine, selectedSeverity, selectedStatus, isRestrictedRole, userMineId]);

  return (
    <div className="bg-coal-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Interactive Mine Hazard & GIS Spatial Map</span>
            {isRestrictedRole && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                Assigned Mine Only ({userMineId})
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Spatial monitoring of mine sectors, geo-tagged field inspections, and active compliance hazard pins
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {!isRestrictedRole && (
            <div className="flex items-center gap-1 bg-coal-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMine}
                onChange={(e) => setSelectedMine(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-xs font-semibold"
              >
                <option value="ALL">All Mines (5 Coalfields)</option>
                {mines.map(m => (
                  <option key={m.mineId} value={m.mineId}>{m.mineName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 bg-coal-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs font-semibold"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-coal-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-800 bg-coal-950 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Legend & Footnote */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white inline-block"></span>
            <span>Mine HQ (Demo Centroids)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block"></span>
            <span>Geo-Tagged Inspection Audit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white inline-block"></span>
            <span>Critical Hazard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white inline-block"></span>
            <span>High Hazard</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
          <Info className="w-3 h-3 text-blue-400 shrink-0" />
          <span>Realtime WebSockets Active • OpenStreetMap Tiles</span>
        </div>
      </div>
    </div>
  );
}

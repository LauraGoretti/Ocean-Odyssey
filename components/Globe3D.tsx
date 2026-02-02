import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { OceanCurrent } from '../types';
import { OCEAN_CURRENTS } from '../data/oceanData';
import * as THREE from 'three';

interface Globe3DProps {
  onCurrentSelect?: (current: OceanCurrent) => void;
  selectedCurrentId?: string | null;
  interactive: boolean;
  width?: number;
  height?: number;
  travelProgress?: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Globe3D: React.FC<Globe3DProps> = ({ 
  onCurrentSelect, 
  selectedCurrentId, 
  interactive,
  width,
  height,
  travelProgress = 0
}) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  // Helper: Interpolate position along path
  const getBubblePosition = (currentId: string, progress: number) => {
    const current = OCEAN_CURRENTS.find(c => c.id === currentId);
    if (!current || !current.path.length) return null;

    const path = current.path;
    // Calculate total length (approximate)
    let totalDist = 0;
    const dists = [0];
    for (let i = 1; i < path.length; i++) {
        const d = Math.sqrt(Math.pow(path[i].lat - path[i-1].lat, 2) + Math.pow(path[i].lng - path[i-1].lng, 2));
        totalDist += d;
        dists.push(totalDist);
    }

    const targetDist = totalDist * (progress / 100);
    
    // Find segment
    let idx = 0;
    while (idx < dists.length - 1 && dists[idx+1] < targetDist) {
        idx++;
    }

    if (idx >= path.length - 1) return path[path.length - 1];

    const segmentStart = dists[idx];
    const segmentLen = dists[idx+1] - dists[idx];
    const segmentProgress = segmentLen === 0 ? 0 : (targetDist - segmentStart) / segmentLen;

    const p1 = path[idx];
    const p2 = path[idx+1];

    return {
        lat: p1.lat + (p2.lat - p1.lat) * segmentProgress,
        lng: p1.lng + (p2.lng - p1.lng) * segmentProgress,
        alt: 0.08 // Bubble altitude
    };
  };

  const bubblePos = useMemo(() => {
    if (selectedCurrentId && travelProgress > 0) {
      return getBubblePosition(selectedCurrentId, travelProgress);
    }
    return null;
  }, [selectedCurrentId, travelProgress]);

  // Focus effect: Selection or Following Bubble
  useEffect(() => {
    if (bubblePos && !interactive) {
      // Follow the bubble closely
      try {
        globeEl.current?.pointOfView({ lat: bubblePos.lat, lng: bubblePos.lng, altitude: 0.4 }, 100);
      } catch (e) {}
    } else if (selectedCurrentId && globeEl.current && interactive) {
      // Selection Focus (Static)
      const current = OCEAN_CURRENTS.find(c => c.id === selectedCurrentId);
      if (current) {
        const start = current.path[0];
        const end = current.path[current.path.length - 1];
        try {
          globeEl.current.pointOfView({ lat: (start.lat + end.lat)/2, lng: (start.lng + end.lng)/2, altitude: 1.8 }, 1000);
        } catch (e) {}
      }
    } else if (globeEl.current && interactive) {
       // Reset view
       try {
         globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
       } catch (e) {}
    }
  }, [selectedCurrentId, interactive, bubblePos]);

  // Configure controls (Auto-rotate & Smooth Zoom)
  useEffect(() => {
    if (!globeEl.current) return;
    try {
      const controls = globeEl.current.controls();
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enableZoom = true;
        controls.zoomSpeed = 0.5;

        if (!interactive && !bubblePos) {
           controls.autoRotate = true;
           controls.autoRotateSpeed = 0.5;
        } else {
           controls.autoRotate = false;
        }
      }
    } catch (e) {}
  }, [interactive, bubblePos]);


  // Prepare data for rendering paths with multi-layer approach for flow visualization
  const pathsData = useMemo(() => {
    const generatedPaths: any[] = [];
    
    OCEAN_CURRENTS.forEach(c => {
      const isHovered = c.id === hoveredPath;
      const isSelected = c.id === selectedCurrentId;
      
      const baseColor = isSelected ? '#FFFFFF' : (isHovered ? '#FFD700' : c.color);

      // 1. BASE PATH (Solid background)
      generatedPaths.push({
        type: 'base',
        id: c.id,
        name: c.name,
        coords: c.path.map(p => [p.lat, p.lng]),
        color: baseColor,
        // Enhanced Scaling: increased hover stroke and altitude for better feedback
        stroke: isSelected ? 5 : (isHovered ? 6 : 2), 
        alt: isSelected || isHovered ? 0.06 : 0.01, // Pop up on hover/select
        dashLength: 1,
        dashGap: 0,
        animateTime: 0
      });

      // 2. FLOW PULSE (Wide, slow, semi-transparent - Current body)
      // Creates the main "pulsating" effect of the current moving
      generatedPaths.push({
        type: 'flow-pulse',
        id: c.id,
        coords: c.path.map(p => [p.lat, p.lng]),
        color: hexToRgba(c.color, 0.6), // Semi-transparent current color
        stroke: isHovered ? 9.0 : 4.0, // Scale up on hover
        alt: isSelected || isHovered ? 0.065 : 0.015,
        dashLength: 0.4, // Long segments
        dashGap: 0.2, // Small gaps
        animateTime: 3000 // Slow pulse
      });

      // 3. FLOW PARTICLES (Fast white dashes - Bubbles/Movement)
      // Visualizes direction and speed
      generatedPaths.push({
        type: 'flow-particles',
        id: c.id,
        coords: c.path.map(p => [p.lat, p.lng]),
        color: 'rgba(255, 255, 255, 0.9)',
        stroke: isHovered ? 3.0 : 1.0, // Scale up on hover
        alt: isSelected || isHovered ? 0.07 : 0.025, // Top layer
        dashLength: 0.02, // Short dots
        dashGap: 0.05,
        animateTime: 1500 // Moderate speed
      });

      // 4. HITBOX PATH (Ghost - for easier clicking)
      if (interactive) {
        generatedPaths.push({
          type: 'hitbox',
          id: c.id,
          name: c.name,
          coords: c.path.map(p => [p.lat, p.lng]),
          color: 'rgba(0,0,0,0.01)', // Almost invisible
          stroke: 20, // Wide hitbox
          alt: 0.02,
          dashLength: 1,
          dashGap: 0,
          animateTime: 0
        });
      }
    });

    return generatedPaths;
  }, [selectedCurrentId, hoveredPath, interactive]);

  // Destination Labels (only end points)
  const labelsData = useMemo(() => {
     return OCEAN_CURRENTS.map(c => ({
       lat: c.path[c.path.length-1].lat,
       lng: c.path[c.path.length-1].lng,
       text: c.endLocation,
       color: 'white',
       size: 1.5
     }));
  }, []);

  // Bubble & Particles Visualization
  const customObjectsData = useMemo(() => {
    if (!bubblePos) return [];

    const objects = [];

    // Main Bubble
    objects.push({
      type: 'bubble',
      lat: bubblePos.lat,
      lng: bubblePos.lng,
      alt: bubblePos.alt,
    });

    // Particles (Plankton/Small bubbles)
    // Reduce spread for tighter trail
    for(let i=0; i<10; i++) {
      objects.push({
        type: 'particle',
        lat: bubblePos.lat + (Math.random() - 0.5) * 0.5, // Reduced spread from 5 to 0.5
        lng: bubblePos.lng + (Math.random() - 0.5) * 0.5,
        alt: bubblePos.alt + (Math.random() - 0.5) * 0.02,
        size: Math.random()
      });
    }

    return objects;

  }, [bubblePos]);

  return (
    <div className={`cursor-${interactive ? 'grab' : 'default'}`}>
      <Globe
        ref={globeEl}
        width={width}
        height={height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Paths configuration
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathColor={(d: any) => d.color}
        pathStroke={(d: any) => d.stroke}
        pathDashLength={(d: any) => d.dashLength}
        pathDashGap={(d: any) => d.dashGap}
        pathAltitude={(d: any) => d.alt}
        pathDashAnimateTime={(d: any) => d.animateTime} // Dynamic animation time
        pathTransitionDuration={300} // Fast transition for responsiveness
        
        // Hover/Label
        pathLabel={(d: any) => (interactive && !d.type.includes('flow')) ? `
          <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-family: sans-serif;">
            <strong>${d.name}</strong><br/>
            Click to send bubble!
          </div>
        ` : ''}
        
        // Interaction
        onPathHover={(path: any) => {
          if (interactive) {
            setHoveredPath(path ? path.id : null);
            document.body.style.cursor = (path && !path.type.includes('flow')) ? 'pointer' : 'default';
          }
        }}
        onPathClick={(path: any) => {
          if (interactive && onCurrentSelect && path) {
             const current = OCEAN_CURRENTS.find(c => c.id === path.id);
             if (current) onCurrentSelect(current);
          }
        }}

        // Labels
        labelsData={labelsData}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelText={(d: any) => d.text}
        labelSize={(d: any) => d.size}
        labelColor={() => 'rgba(255, 255, 255, 0.75)'}
        labelDotRadius={0.5}

        // Custom HTML Elements (Bubble & Particles)
        htmlElementsData={customObjectsData}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlAltitude={(d: any) => d.alt}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          
          if (d.type === 'bubble') {
            el.innerHTML = '🫧';
            el.style.fontSize = '40px';
            el.style.textShadow = '0 0 10px cyan';
            el.style.animation = 'float 2s infinite ease-in-out';
            el.style.transform = 'translate(-50%, -50%)';
          } else {
            // Particle
            el.style.width = '4px';
            el.style.height = '4px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = 'rgba(100, 255, 255, 0.6)';
            el.style.boxShadow = '0 0 5px white';
          }
          
          return el;
        }}

        atmosphereColor="lightskyblue"
        atmosphereAltitude={0.15}
      />
    </div>
  );
};

export default Globe3D;
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Institution } from '../types';

interface InstitutionBarMap3DProps {
  institutions: Institution[];
  onSelectInstitution?: (institution: Institution) => void;
  selectedId?: string;
}

export const InstitutionBarMap3D: React.FC<InstitutionBarMap3DProps> = ({
  institutions,
  onSelectInstitution,
  selectedId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredInst, setHoveredInst] = useState<Institution | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A2A33); // harbor
    scene.fog = new THREE.Fog(0x0A2A33, 40, 95);

    // 2. Isometric-style Perspective Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 500);
    camera.position.set(28, 30, 36);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x184755, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xF6F9F9, 1.6);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x6B8794, 0.8);
    backLight.position.set(-20, 15, -20);
    scene.add(backLight);

    // Floor Base
    const floorGeom = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x072027,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid lines on floor
    const grid = new THREE.GridHelper(48, 24, 0x1A4856, 0x0F3642);
    grid.position.y = 0;
    scene.add(grid);

    // 5. Layout bars in an isometric grid
    const displayInstitutions = institutions.slice(0, 36);
    const cols = 6;
    const spacing = 3.6;
    const barMeshes: THREE.Mesh[] = [];
    const targetHeights: number[] = [];
    const currentHeights: number[] = [];

    // Pre-calculate heights
    displayInstitutions.forEach((inst, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      const posX = (col - cols / 2 + 0.5) * spacing;
      const posZ = (row - Math.floor(displayInstitutions.length / cols) / 2 + 0.5) * spacing;

      const isSurge = inst.surge_ratio >= 3.0;
      const isSelected = selectedId === inst.id;
      const finalH = Math.max(1.0, Math.min(inst.surge_ratio * 2.8, 14));
      targetHeights.push(finalH);
      currentHeights.push(0.01);

      const geom = new THREE.BoxGeometry(2.0, 1, 2.0);
      const color = isSurge ? 0xE0452B : isSelected ? 0x2F9E8F : 0x0F4C5C;

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.15,
        flatShading: true,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(posX, 0.01, posZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { inst, idx, targetH: finalH, origY: 0.01, isSurge };

      scene.add(mesh);
      barMeshes.push(mesh);
    });

    // 6. Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(barMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const inst = hit.userData.inst as Institution;
        setHoveredInst(inst);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = 'pointer';

        // Slightly lift hovered bar
        hit.position.y = hit.userData.origY + 0.6;
      } else {
        setHoveredInst(null);
        setTooltipPos(null);
        container.style.cursor = 'default';
        barMeshes.forEach(b => {
          b.position.y = b.userData.origY;
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(barMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const inst = hit.userData.inst as Institution;
        if (onSelectInstitution) {
          onSelectInstitution(inst);
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 7. Entrance Animation: Bars rise in sequence over 600ms
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let startTime = performance.now();
    let animId: number;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const elapsed = currentTime - startTime;

      barMeshes.forEach((mesh, idx) => {
        const targetH = mesh.userData.targetH;
        if (prefersReducedMotion) {
          mesh.scale.y = targetH;
          mesh.position.y = targetH / 2;
          mesh.userData.origY = targetH / 2;
        } else {
          // Sequenced delay based on row and col
          const delay = (idx % 6) * 35 + Math.floor(idx / 6) * 45;
          const progress = Math.min(1, Math.max(0, (elapsed - delay) / 450));
          // ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const currentH = Math.max(0.05, targetH * ease);
          mesh.scale.y = currentH;
          mesh.position.y = currentH / 2;
          mesh.userData.origY = currentH / 2;
        }
      });

      // Very subtle slow drift
      if (!prefersReducedMotion) {
        scene.rotation.y = Math.sin(currentTime * 0.0003) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [institutions, selectedId]);

  return (
    <div className="relative w-full h-[380px] rounded-lg overflow-hidden border border-harbor-border bg-harbor shadow-elevated">
      <div ref={containerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-4 px-3 py-1.5 rounded bg-harbor-surface/90 border border-harbor-border text-12 text-steel-light backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-signal inline-block" />
          <span className="text-signal-subtle font-medium">Surge &gt; 3x Active (Flagged)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-petrol inline-block" />
          <span>Nominal Volume (Normal)</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredInst && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none p-3 rounded-lg bg-ink/95 text-white border border-steel/30 shadow-floating text-12 min-w-[220px] -translate-x-1/2 -translate-y-16 animate-fadeIn"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="font-display font-semibold text-14 text-white line-clamp-1">
            {hoveredInst.name}
          </div>
          <div className="text-[11px] text-steel-light mt-0.5">
            {hoveredInst.type} • {hoveredInst.state}
          </div>
          <div className="mt-2 pt-2 border-t border-steel/20 grid grid-cols-2 gap-2 text-11">
            <div>
              <span className="text-steel-light block">Active Capacity:</span>
              <span className="font-medium text-white tabular-nums">{hoveredInst.active}</span>
            </div>
            <div>
              <span className="text-steel-light block">Applications:</span>
              <span className="font-medium text-white tabular-nums">{hoveredInst.applications}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-steel-light text-11">Surge Multiplier:</span>
            <span
              className={`font-semibold tabular-nums ${
                hoveredInst.surge_ratio >= 3.0 ? 'text-signal' : 'text-sea'
              }`}
            >
              {hoveredInst.surge_ratio}x
            </span>
          </div>
          <div className="text-[10px] text-steel-light mt-1.5 italic text-center">
            Click bar to inspect flagged clusters
          </div>
        </div>
      )}
    </div>
  );
};

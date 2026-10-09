import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GraphData, GraphNode } from '../types';
import { RotateCcw, Play, Pause, Maximize2, Shield, Eye, Info } from 'lucide-react';

interface GraphStage3DProps {
  graph: GraphData;
  clusterId?: string;
  onSelectNode?: (node: GraphNode | null) => void;
}

export const GraphStage3D: React.FC<GraphStage3DProps> = ({
  graph,
  clusterId,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isAutoOrbit, setIsAutoOrbit] = useState(true);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // References to three objects for external controls
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const initialCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 18, 30));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let autoRotate = !prefersReducedMotion && isAutoOrbit;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A2A33); // harbor
    scene.fog = new THREE.FogExp2(0x0A2A33, 0.018);

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.copy(initialCamPos.current);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controls.maxDistance = 80;
    controls.minDistance = 6;
    controlsRef.current = controls;

    // User drag stops auto-orbit
    const onStartDrag = () => {
      controls.autoRotate = false;
      setIsAutoOrbit(false);
    };
    controls.addEventListener('start', onStartDrag);

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x184755, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xF6F9F9, 1.6);
    keyLight.position.set(20, 35, 20);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6B8794, 1.0);
    rimLight.position.set(-20, -10, -25);
    scene.add(rimLight);

    // 6. Subtle Floor Grid
    const grid = new THREE.GridHelper(60, 40, 0x1A4856, 0x0F3642);
    grid.position.y = -6;
    scene.add(grid);

    // 7. Graph Layout Computation
    const nodePositions = new Map<string, THREE.Vector3>();
    const sharedNodes = graph.nodes.filter(n => n.is_shared || n.type === 'bank' || n.type === 'mobile');
    const studentNodes = graph.nodes.filter(n => n.type === 'student');
    const otherNodes = graph.nodes.filter(n => !n.is_shared && n.type !== 'student' && n.type !== 'bank' && n.type !== 'mobile');

    // Central cluster for shared hubs
    sharedNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, sharedNodes.length)) * Math.PI * 2;
      const r = sharedNodes.length === 1 ? 0 : 3.5;
      const pos = new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      nodePositions.set(node.id, pos);
    });

    // Middle ring for students
    studentNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, studentNodes.length)) * Math.PI * 2;
      const r = 9.5;
      const yOffset = (idx % 2 === 0 ? 1 : -1) * 1.8;
      const pos = new THREE.Vector3(Math.cos(angle) * r, yOffset, Math.sin(angle) * r);
      nodePositions.set(node.id, pos);
    });

    // Outer ring for institutions, addresses, documents
    otherNodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, otherNodes.length)) * Math.PI * 2 + 0.3;
      const r = 16.0;
      const yOffset = (idx % 2 === 0 ? 2 : -2) * 1.5;
      const pos = new THREE.Vector3(Math.cos(angle) * r, yOffset, Math.sin(angle) * r);
      nodePositions.set(node.id, pos);
    });

    // Fallback for any unpositioned nodes
    graph.nodes.forEach((node, idx) => {
      if (!nodePositions.has(node.id)) {
        const phi = Math.acos(-1 + (2 * idx) / graph.nodes.length);
        const theta = Math.sqrt(graph.nodes.length * Math.PI) * phi;
        const r = 11;
        nodePositions.set(node.id, new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.cos(phi),
          r * Math.sin(theta) * Math.sin(phi)
        ));
      }
    });

    // 8. 3D Node Mesh Creation
    const nodeMeshes: THREE.Mesh[] = [];
    const haloMeshes: THREE.Mesh[] = [];
    const nodeMeshMap = new Map<string, THREE.Mesh>();

    graph.nodes.forEach((node) => {
      const pos = nodePositions.get(node.id) || new THREE.Vector3(0, 0, 0);
      let geom: THREE.BufferGeometry;
      let mat: THREE.Material;

      switch (node.type) {
        case 'bank': // faceted octahedron (signal when shared)
          geom = new THREE.OctahedronGeometry(1.6, 0);
          mat = new THREE.MeshStandardMaterial({
            color: node.is_shared || node.risk === 'high' ? 0xE0452B : 0x0F4C5C,
            flatShading: true,
            roughness: 0.3,
            metalness: 0.2,
          });
          break;

        case 'mobile': // cube (amber when shared)
          geom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
          mat = new THREE.MeshStandardMaterial({
            color: node.is_shared || node.risk === 'high' || node.risk === 'amber' ? 0xE8A02A : 0x6B8794,
            flatShading: true,
            roughness: 0.35,
          });
          break;

        case 'institution': // short cylinder (paper)
          geom = new THREE.CylinderGeometry(1.6, 1.6, 0.9, 16);
          mat = new THREE.MeshStandardMaterial({
            color: 0xF6F9F9,
            roughness: 0.5,
          });
          break;

        case 'address': // cone (steel)
          geom = new THREE.ConeGeometry(1.0, 1.8, 16);
          mat = new THREE.MeshStandardMaterial({
            color: 0x6B8794,
            roughness: 0.4,
          });
          break;

        case 'document': // flat slab (sea)
          geom = new THREE.BoxGeometry(1.6, 0.3, 2.0);
          mat = new THREE.MeshStandardMaterial({
            color: 0x2F9E8F,
            roughness: 0.4,
          });
          break;

        case 'student':
        default: // small sphere (steel)
          geom = new THREE.SphereGeometry(0.85, 24, 24);
          mat = new THREE.MeshStandardMaterial({
            color: node.risk === 'flagged' ? 0x9AB0BC : 0x6B8794,
            roughness: 0.35,
            metalness: 0.1,
          });
          break;
      }

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.userData = { node };
      scene.add(mesh);
      nodeMeshes.push(mesh);
      nodeMeshMap.set(node.id, mesh);

      // Add Emissive Halo for shared flagged nodes
      if (node.is_shared || node.risk === 'high') {
        const haloGeom = new THREE.SphereGeometry(2.3, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
          color: node.type === 'mobile' ? 0xE8A02A : 0xE0452B,
          wireframe: true,
          transparent: true,
          opacity: 0.25,
        });
        const halo = new THREE.Mesh(haloGeom, haloMat);
        halo.position.copy(pos);
        scene.add(halo);
        haloMeshes.push(halo);
      }
    });

    // 9. 3D Tube Edges
    graph.edges.forEach((edge) => {
      const p1 = nodePositions.get(edge.source);
      const p2 = nodePositions.get(edge.target);
      if (!p1 || !p2) return;

      const distance = p1.distanceTo(p2);
      const edgeGeom = new THREE.CylinderGeometry(
        edge.flagged ? 0.08 : 0.04,
        edge.flagged ? 0.12 : 0.04,
        distance,
        8
      );

      const edgeMat = new THREE.MeshStandardMaterial({
        color: edge.flagged ? 0xE0452B : 0x1A4856,
        roughness: 0.4,
        transparent: true,
        opacity: edge.flagged ? 0.85 : 0.4,
      });

      const edgeMesh = new THREE.Mesh(edgeGeom, edgeMat);
      // Position halfway between p1 and p2
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      edgeMesh.position.copy(mid);

      // Orient cylinder along p1 -> p2
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const axis = new THREE.Vector3(0, 1, 0);
      edgeMesh.quaternion.setFromUnitVectors(axis, dir);

      scene.add(edgeMesh);
    });

    // 10. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hitNode = intersects[0].object.userData.node as GraphNode;
        setHoveredNode(hitNode);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        setTooltipPos(null);
        container.style.cursor = 'grab';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hitNode = intersects[0].object.userData.node as GraphNode;
        setSelectedNode(hitNode);
        if (onSelectNode) onSelectNode(hitNode);

        // Smooth camera glide toward node
        const targetPos = nodePositions.get(hitNode.id);
        if (targetPos) {
          controls.target.copy(targetPos);
        }
      } else {
        setSelectedNode(null);
        if (onSelectNode) onSelectNode(null);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // 11. Animation Loop with Performance Throttling
    let animId: number;
    let clock = new THREE.Clock();
    let isTabVisible = true;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isTabVisible) return; // Pause rendering when tab hidden

      const delta = clock.getElapsedTime();
      controls.update();

      // Pulse halos
      haloMeshes.forEach((halo, idx) => {
        const scale = 1 + Math.sin(delta * 2.2 + idx) * 0.12;
        halo.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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
      document.removeEventListener('visibilitychange', onVisibilityChange);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      controls.removeEventListener('start', onStartDrag);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [graph, isAutoOrbit]);

  const handleResetView = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.copy(initialCamPos.current);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.autoRotate = true;
      setIsAutoOrbit(true);
    }
  };

  const toggleOrbit = () => {
    if (controlsRef.current) {
      const next = !isAutoOrbit;
      controlsRef.current.autoRotate = next;
      setIsAutoOrbit(next);
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-lg overflow-hidden border border-harbor-border bg-harbor shadow-elevated select-none">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Toolbar (Top Right) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={toggleOrbit}
          title={isAutoOrbit ? 'Pause camera orbit' : 'Resume camera orbit'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-medium rounded bg-harbor-surface/90 text-steel-light border border-harbor-border hover:text-white hover:bg-harbor-border transition-colors backdrop-blur-sm"
        >
          {isAutoOrbit ? (
            <>
              <Pause className="w-3.5 h-3.5 text-sea" strokeWidth={1.5} />
              <span>Orbiting</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-steel-light" strokeWidth={1.5} />
              <span>Orbit paused</span>
            </>
          )}
        </button>

        <button
          onClick={handleResetView}
          title="Reset 3D camera"
          className="flex items-center gap-1.5 px-3 py-1.5 text-12 font-medium rounded bg-harbor-surface/90 text-steel-light border border-harbor-border hover:text-white hover:bg-harbor-border transition-colors backdrop-blur-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Reset view</span>
        </button>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none px-3 py-2 rounded bg-ink/95 text-white border border-steel/30 shadow-floating text-12 max-w-xs -translate-x-1/2 -translate-y-12"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-1.5 font-display font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredNode.is_shared || hoveredNode.risk === 'high'
                  ? 'bg-signal'
                  : hoveredNode.type === 'mobile'
                  ? 'bg-amber'
                  : 'bg-steel'
              }`}
            />
            <span>{hoveredNode.label}</span>
          </div>
          <div className="text-[11px] text-steel-light capitalize mt-0.5">
            Type: {hoveredNode.type} {hoveredNode.details && `• ${hoveredNode.details}`}
          </div>
        </div>
      )}

      {/* Glassmorphism Legend (Bottom Left) - STRICT: Allowed single glassmorphism instance */}
      <div className="absolute bottom-4 left-4 z-20 px-3 py-2.5 rounded-lg bg-harbor-surface/75 border border-harbor-border/80 shadow-floating backdrop-blur-md">
        <div className="text-[11px] font-semibold tracking-wider text-steel-light uppercase mb-2">
          Node Entity Morphology
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-12">
          <div className="flex items-center gap-2 text-paper">
            <span className="w-2.5 h-2.5 rounded-full bg-steel inline-block" />
            <span className="text-12">Student (Sphere)</span>
          </div>
          <div className="flex items-center gap-2 text-paper">
            <span className="w-2.5 h-2.5 bg-signal rotate-45 inline-block" />
            <span className="text-12 font-medium text-signal-subtle">Shared Bank (Octahedron)</span>
          </div>
          <div className="flex items-center gap-2 text-paper">
            <span className="w-2.5 h-2.5 bg-amber inline-block" />
            <span className="text-12 font-medium text-amber-subtle">Shared Mobile (Cube)</span>
          </div>
          <div className="flex items-center gap-2 text-paper">
            <span className="w-2.5 h-2 rounded-t-sm bg-paper inline-block" />
            <span className="text-12">Institution (Cylinder)</span>
          </div>
          <div className="flex items-center gap-2 text-paper">
            <span className="w-2.5 h-2.5 bg-steel rotate-180 inline-block" />
            <span className="text-12">Address (Cone)</span>
          </div>
          <div className="flex items-center gap-2 text-paper">
            <span className="w-2.5 h-1.5 bg-sea inline-block" />
            <span className="text-12">Document Hash (Slab)</span>
          </div>
        </div>
      </div>

      {/* Selected Node Inspector Drawer (Bottom Right) */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-20 max-w-sm w-full p-4 rounded-lg bg-harbor-surface/95 border border-harbor-border shadow-floating text-white backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between border-b border-harbor-border pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  selectedNode.is_shared ? 'bg-signal animate-signal-pulse' : 'bg-steel-light'
                }`}
              />
              <span className="font-display font-semibold text-14 text-white">
                {selectedNode.label}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedNode(null);
                if (onSelectNode) onSelectNode(null);
              }}
              className="text-11 text-steel-light hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <div className="text-12 space-y-1 text-steel-light">
            <div>
              <span className="font-medium text-paper">Entity ID:</span> {selectedNode.id}
            </div>
            <div>
              <span className="font-medium text-paper">Category:</span>{' '}
              <span className="capitalize">{selectedNode.type}</span>
            </div>
            {selectedNode.details && (
              <div>
                <span className="font-medium text-paper">Attributes:</span> {selectedNode.details}
              </div>
            )}
            {selectedNode.is_shared && (
              <div className="mt-2 p-2 rounded bg-signal/15 border border-signal/30 text-signal font-medium text-11">
                Shared convergence point: linked across multiple non-family student applications.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

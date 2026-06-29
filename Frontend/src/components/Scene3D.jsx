import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const COLORS = {
  cyan: new THREE.Color(0x22d3ee),
  purple: new THREE.Color(0xa78bfa),
  pink: new THREE.Color(0xf472b6),
  amber: new THREE.Color(0xfbbf24),
  red: new THREE.Color(0xef4444),
};

function createShape(geometry, color, pos) {
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.35,
    emissive: color,
    emissiveIntensity: 0.08,
    wireframe: Math.random() > 0.6,
  });
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(pos.x, pos.y, pos.z);
  const scale = 0.4 + Math.random() * 0.8;
  mesh.scale.set(scale, scale, scale);
  // Store random animation params and base positions
  mesh.userData = {
    rotSpeed: { x: (Math.random() - 0.5) * 0.008, y: (Math.random() - 0.5) * 0.008 },
    floatSpeed: 0.002 + Math.random() * 0.004,
    floatAmp: 0.3 + Math.random() * 0.6,
    floatOffset: Math.random() * Math.PI * 2,
    baseY: pos.y,
    baseX: pos.x,
    baseZ: pos.z,
    mouseInfluence: 0.4 + Math.random() * 0.6,
  };
  return mesh;
}

export default function Scene3D() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const shapesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;
    camera.position.y = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create shapes
    const shapes = [];
    const geometries = [
      new THREE.OctahedronGeometry(1),
      new THREE.TetrahedronGeometry(1),
      new THREE.IcosahedronGeometry(1),
      new THREE.TorusKnotGeometry(0.7, 0.25, 64, 8),
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
    ];

    const colorKeys = Object.keys(COLORS);
    const spread = 6;

    for (let i = 0; i < 30; i++) {
      const geo = geometries[i % geometries.length];
      const color = COLORS[colorKeys[i % colorKeys.length]];
      const pos = {
        x: (Math.random() - 0.5) * spread * 2,
        y: (Math.random() - 0.5) * spread * 1.2,
        z: (Math.random() - 0.5) * spread * 0.8 - 2,
      };
      const mesh = createShape(geo, color, pos);
      scene.add(mesh);
      shapes.push(mesh);
    }
    shapesRef.current = shapes;

    // Mouse handler
    const handleMouse = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    // Touch handler
    const handleTouch = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((touch.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((touch.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    container.addEventListener('mousemove', handleMouse);
    container.addEventListener('touchmove', handleTouch);

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let time = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      shapes.forEach((mesh) => {
        const ud = mesh.userData;

        // Rotation
        mesh.rotation.x += ud.rotSpeed.x;
        mesh.rotation.y += ud.rotSpeed.y;

        // Float
        const float = Math.sin(time * ud.floatSpeed * 10 + ud.floatOffset) * ud.floatAmp;
        mesh.position.y = ud.baseY + float * 0.3;

          // Mouse parallax — shift shapes based on cursor position
        mesh.position.x = ud.baseX + mx * ud.mouseInfluence * 0.4;
        mesh.position.y = ud.baseY + float * 0.3 + my * ud.mouseInfluence * 0.2;
        mesh.position.z = ud.baseZ + mx * ud.mouseInfluence * 0.15;
      });

      // Subtle camera sway
      camera.position.x += (mx * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (-my * 0.2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, -2);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      container.removeEventListener('mousemove', handleMouse);
      container.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      shapes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    />
  );
}

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface GlassCard3DProps {
  title?: string;
  subtitle?: string;
}

export const GlassCard3D = ({ title = "Glass Morphism", subtitle = "mockup." }: GlassCard3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
    light1.position.set(2, 3, 4);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-2, -1, 2);
    scene.add(light2);

    const geometry = new THREE.BoxGeometry(1.6, 1.0, 0.04);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.4,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
    });
    
    const card = new THREE.Mesh(geometry, material);
    scene.add(card);

    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
    card.add(line);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      card.rotation.y = x * 0.3;
      card.rotation.x = y * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 400;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [title, subtitle]);

  return (
    <div className="landing-chat glass-3d-wrapper" ref={containerRef}>
      <div className="landing-chat__content glass-3d-overlay">
        <h2 className="landing-chat__title">{title}</h2>
        <p className="landing-chat__subtitle">{subtitle}</p>
        <div className="landing-chat__badges">
          <div className="landing-chat__badge">UI</div>
          <div className="landing-chat__badge">UX</div>
        </div>
        <p className="landing-chat__footer">Isolated Objects &amp; Editable Colors</p>
      </div>
    </div>
  );
};
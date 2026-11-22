"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AiPotholeIllustration } from "@/components/illustrations/AiPotholeIllustration";
import { useTheme } from "@/components/providers/ThemeProvider";

export function RoadSurface3D({
  className = "w-full h-[320px]",
  depthMm = 68,
  severity = "High",
}) {
  const containerRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const { currentThemeConfig } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    try {
      const canvasTest = document.createElement("canvas");
      const gl =
        canvasTest.getContext("webgl") ||
        canvasTest.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    let animationFrameId;
    let renderer;

    try {
      const scene = new THREE.Scene();

      const width = container.clientWidth || 400;
      const height = container.clientHeight || 320;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 6, 8);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const primaryHex = currentThemeConfig?.colors?.primary
        ? parseInt(currentThemeConfig.colors.primary.replace("#", "0x"), 16)
        : 0xf36b21;
      const isDark = currentThemeConfig?.mode === "dark";

      // Lighting
      const ambLight = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.9);
      scene.add(ambLight);

      const pointLight = new THREE.PointLight(primaryHex, 2.5, 20);
      pointLight.position.set(2, 5, 3);
      scene.add(pointLight);

      // Create a terrain/road grid with crater depression in center
      const segments = 40;
      const roadGeo = new THREE.PlaneGeometry(8, 8, segments, segments);
      roadGeo.rotateX(-Math.PI / 2);

      const positions = roadGeo.attributes.position;
      const depthFactor = (depthMm / 100) * 1.5;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 2.0) {
          // Crater curve
          const depression = Math.cos((distFromCenter / 2.0) * (Math.PI / 2)) * depthFactor;
          // Add micro surface roughness
          const roughness = (Math.sin(x * 10) * Math.cos(z * 10)) * 0.04;
          positions.setY(i, -depression + roughness);
        } else {
          // Flat road with slight texture
          const roughness = (Math.sin(x * 12) * Math.cos(z * 12)) * 0.02;
          positions.setY(i, roughness);
        }
      }

      roadGeo.computeVertexNormals();

      // Road Material
      const roadMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1e293b : 0x475569,
        wireframe: false,
        roughness: 0.85,
        metalness: 0.1,
      });

      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      scene.add(roadMesh);

      // Wireframe Overlay to accentuate 3D contours
      const wireMat = new THREE.MeshBasicMaterial({
        color: primaryHex,
        wireframe: true,
        transparent: true,
        opacity: isDark ? 0.35 : 0.2,
      });
      const wireMesh = new THREE.Mesh(roadGeo.clone(), wireMat);
      wireMesh.position.y = 0.01;
      scene.add(wireMesh);

      // Center laser scanning marker
      const markerGeo = new THREE.RingGeometry(0.1, 0.25, 32);
      markerGeo.rotateX(-Math.PI / 2);
      const markerMat = new THREE.MeshBasicMaterial({
        color: primaryHex,
        side: THREE.DoubleSide,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(0, -depthFactor + 0.02, 0);
      scene.add(marker);

      // Rotation Animation
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Slow smooth wobble & rotation
        scene.rotation.y = Math.sin(elapsed * 0.5) * 0.35;
        scene.rotation.x = 0.08 + Math.cos(elapsed * 0.4) * 0.05;

        // Pulse the marker
        const scale = 1 + Math.sin(elapsed * 4) * 0.2;
        marker.scale.set(scale, scale, 1);

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        if (renderer && renderer.domElement) {
          renderer.domElement.remove();
          renderer.dispose();
        }
      };
    } catch (e) {
      console.warn("RoadSurface3D WebGL failed:", e);
      setWebglSupported(false);
    }
  }, [depthMm, severity, currentThemeConfig]);

  if (!webglSupported) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <AiPotholeIllustration className="max-h-full max-w-full drop-shadow-sm" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
        <span>3D Contour Mesh ({depthMm}mm depth profile)</span>
      </div>
    </div>
  );
}

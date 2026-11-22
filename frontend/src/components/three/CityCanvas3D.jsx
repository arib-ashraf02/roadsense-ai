"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroRoadIllustration } from "@/components/illustrations/HeroRoadIllustration";
import { useTheme } from "@/components/providers/ThemeProvider";

export function CityCanvas3D({ className = "w-full h-[400px]" }) {
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
      // Scene & Camera
      const scene = new THREE.Scene();

      const width = container.clientWidth || 500;
      const height = container.clientHeight || 400;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(12, 14, 16);
      camera.lookAt(0, 0, 0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      // Colors based on current theme
      const primaryHex = currentThemeConfig?.colors?.primary
        ? parseInt(currentThemeConfig.colors.primary.replace("#", "0x"), 16)
        : 0xf36b21;
      const bgIsDark = currentThemeConfig?.mode === "dark";

      // Ambient & Directional Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, bgIsDark ? 0.7 : 0.9);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(10, 20, 10);
      scene.add(dirLight);

      const accentLight = new THREE.PointLight(primaryHex, 2, 25);
      accentLight.position.set(0, 5, 0);
      scene.add(accentLight);

      // Ground plane grid
      const groundGeo = new THREE.PlaneGeometry(24, 24);
      const groundMat = new THREE.MeshStandardMaterial({
        color: bgIsDark ? 0x141e38 : 0xf4eee9,
        roughness: 0.9,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.05;
      scene.add(ground);

      // Road ribbons
      const roadMat = new THREE.MeshStandardMaterial({
        color: bgIsDark ? 0x0f172a : 0xe2ded9,
        roughness: 0.7,
      });

      // Horizontal Road
      const roadX = new THREE.Mesh(new THREE.PlaneGeometry(24, 3.2), roadMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.y = 0.01;
      scene.add(roadX);

      // Vertical Road
      const roadZ = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 24), roadMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.y = 0.02;
      scene.add(roadZ);

      // Procedural City Buildings (Blocks)
      const buildingsGroup = new THREE.Group();
      const buildingColors = bgIsDark
        ? [0x1c2541, 0x223055, 0x172038]
        : [0xffffff, 0xfbf8f5, 0xeee7e0];

      const buildingPositions = [
        { x: -5, z: -5, w: 3, d: 3, h: 4 },
        { x: -5, z: 5, w: 3, d: 2.5, h: 6 },
        { x: 5, z: -5, w: 2.8, d: 3.5, h: 5 },
        { x: 5, z: 5, w: 3.2, d: 3.2, h: 7 },
        { x: -9, z: -5, w: 2, d: 3, h: 3 },
        { x: 9, z: 5, w: 2, d: 2.5, h: 3.5 },
      ];

      buildingPositions.forEach((pos, idx) => {
        const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
        const mat = new THREE.MeshStandardMaterial({
          color: buildingColors[idx % buildingColors.length],
          roughness: 0.4,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos.x, pos.h / 2, pos.z);
        buildingsGroup.add(mesh);
      });
      scene.add(buildingsGroup);

      // Hazard Pins (Pulsing Pothole Markers on the road)
      const hazardPins = [];
      const pinPositions = [
        { x: 0, z: -3.5, severity: "High" },
        { x: 2.5, z: 0, severity: "Critical" },
        { x: -4.5, z: 0, severity: "Medium" },
      ];

      pinPositions.forEach((pos) => {
        const pinGroup = new THREE.Group();
        pinGroup.position.set(pos.x, 0.2, pos.z);

        // Pin cone
        const coneGeo = new THREE.ConeGeometry(0.35, 1, 16);
        coneGeo.rotateX(Math.PI);
        const coneMat = new THREE.MeshStandardMaterial({
          color: primaryHex,
          emissive: primaryHex,
          emissiveIntensity: 0.6,
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.8;
        pinGroup.add(cone);

        // Pin Head Sphere
        const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: primaryHex,
          emissive: primaryHex,
          emissiveIntensity: 0.8,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.y = 1.35;
        pinGroup.add(sphere);

        // Pulsing base ring
        const ringGeo = new THREE.RingGeometry(0.3, 0.65, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: primaryHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.05;
        pinGroup.add(ring);

        scene.add(pinGroup);
        hazardPins.push({ group: pinGroup, ring });
      });

      // Mouse drag rotation interaction
      let isDragging = false;
      let prevMousePos = { x: 0, y: 0 };
      let targetRotationY = 0.5;

      const handleMouseDown = (e) => {
        isDragging = true;
        prevMousePos = { x: e.clientX, y: e.clientY };
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMousePos.x;
        targetRotationY += deltaX * 0.005;
        prevMousePos = { x: e.clientX, y: e.clientY };
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      const domElem = renderer.domElement;
      domElem.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      // Handle Resize
      const handleResize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      // Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Slow auto-rotation when not dragging
        if (!isDragging) {
          targetRotationY += 0.002;
        }

        scene.rotation.y = THREE.MathUtils.lerp(
          scene.rotation.y,
          targetRotationY,
          0.05
        );

        // Animate hazard pins (pulse + bob)
        hazardPins.forEach((pin, i) => {
          const bounce = Math.sin(elapsed * 3 + i) * 0.15;
          pin.group.position.y = 0.2 + bounce;

          // Pulse ring scale
          const scale = 1 + Math.sin(elapsed * 4 + i) * 0.3;
          pin.ring.scale.set(scale, scale, 1);
          pin.ring.material.opacity = 0.8 - (scale - 1);
        });

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (domElem) {
          domElem.removeEventListener("mousedown", handleMouseDown);
        }
        if (renderer && renderer.domElement) {
          renderer.domElement.remove();
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to 2D view:", err);
      setWebglSupported(false);
    }
  }, [currentThemeConfig]);

  if (!webglSupported) {
    return (
      <div className={`relative flex items-center justify-center p-4 ${className}`}>
        <HeroRoadIllustration className="max-h-full max-w-full drop-shadow-md" />
      </div>
    );
  }

  return (
    <div className={`relative cursor-grab active:cursor-grabbing ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm shadow-sm">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span>Interactive 3D City Model (Drag to Orbit)</span>
      </div>
    </div>
  );
}

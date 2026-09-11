import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { C, FONT } from "../ui/tokens";
import { AppIcon } from "../ui/icons";

export type MorphologyShape = "hourglass" | "rectangle" | "pear" | "inverted-triangle" | "oval";

export interface GarmentStyleConfig {
  id: string;
  name: string;
  category: string;
  recommendedFor: MorphologyShape[];
  description: string;
  accentCut: string;
}

export const GARMENT_STYLES: GarmentStyleConfig[] = [
  {
    id: "wrap-dress",
    name: "Architectural Wrap Midi Dress",
    category: "Dresses",
    recommendedFor: ["hourglass", "pear"],
    description: "Surplice neckline with an asymmetrical wrap tie that pinches the natural waist and cascades into a fluid A-line drape.",
    accentCut: "Cinching sash with gentle flare",
  },
  {
    id: "structured-blazer",
    name: "Bespoke Structured Blazer & Trouser",
    category: "Suiting",
    recommendedFor: ["rectangle", "inverted-triangle", "oval"],
    description: "Tailored peak lapels with structured light-padded shoulder and tapered waist suppression, paired with clean pleat trousers.",
    accentCut: "Hand-canvassed chest & clean shoulder drape",
  },
  {
    id: "boatneck-gown",
    name: "A-Line Boatneck Evening Gown",
    category: "Evening",
    recommendedFor: ["pear", "rectangle"],
    description: "High bateau neckline widening the visual shoulder line, harmonizing with a bell-shaped circular skirt.",
    accentCut: "Balanced horizontal neckline & volume flare",
  },
  {
    id: "empire-maxi",
    name: "Regal Empire-Waist Pleated Gown",
    category: "Gala",
    recommendedFor: ["oval", "inverted-triangle"],
    description: "High waistline starting directly below the bust line, cascading vertically to elongate the silhouette effortlessly.",
    accentCut: "Elevated waist seam & vertical flute pleats",
  },
  {
    id: "peplum-suit",
    name: "Sculpted Peplum & Pencil Cut",
    category: "Couture",
    recommendedFor: ["hourglass", "rectangle", "inverted-triangle"],
    description: "Fitted bodice with architectural waist flare that creates an immediate hourglass illusion over a clean pencil skirt.",
    accentCut: "Flares at high hip with tailored structure",
  },
];

export interface FabricOption {
  id: string;
  name: string;
  textureType: "silk" | "linen" | "ankara" | "velvet" | "wool";
  roughness: number;
  metalness: number;
  description: string;
  specularColor?: string;
}

export const FABRIC_OPTIONS: FabricOption[] = [
  { id: "silk", name: "Silk Satin Charmeuse", textureType: "silk", roughness: 0.18, metalness: 0.25, description: "Fluid liquid drape with luminous specular sheen." },
  { id: "ankara", name: "Ankara Wax Print", textureType: "ankara", roughness: 0.65, metalness: 0.05, description: "Structured African cotton with vibrant cultural geometry." },
  { id: "velvet", name: "Royal Micro-Velvet", textureType: "velvet", roughness: 0.55, metalness: 0.15, description: "Plush tactile depth with luminous rim reflection." },
  { id: "linen", name: "Artisanal Raw Linen", textureType: "linen", roughness: 0.85, metalness: 0.0, description: "Breathable crisp organic weave with gentle slubs." },
  { id: "wool", name: "Super 140s Worsted Wool", textureType: "wool", roughness: 0.5, metalness: 0.1, description: "Refined suiting drape with impeccable shape retention." },
];

export const COLOR_SWATCHES = [
  { name: "Emerald Forest", hex: "#1A4D3E" },
  { name: "Royal Indigo", hex: "#1E2A4A" },
  { name: "Terracotta Amber", hex: "#B85D38" },
  { name: "Burgundy Wine", hex: "#6E1A2C" },
  { name: "Onyx Midnight", hex: "#232326" },
  { name: "Warm Champagne", hex: "#D6C4A5" },
];

interface MannequinViewer3DProps {
  morphology?: MorphologyShape;
  selectedStyleId?: string;
  selectedFabricId?: string;
  selectedColorHex?: string;
  onStyleChange?: (styleId: string) => void;
  onFabricChange?: (fabricId: string) => void;
  onColorChange?: (colorHex: string) => void;
  height?: number;
  interactive?: boolean;
}

export default function MannequinViewer3D({
  morphology = "hourglass",
  selectedStyleId = "wrap-dress",
  selectedFabricId = "silk",
  selectedColorHex = "#1A4D3E",
  onStyleChange,
  onFabricChange,
  onColorChange,
  height = 540,
  interactive = true,
}: MannequinViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);
  const mannequinMeshRef = useRef<THREE.Mesh | null>(null);

  const [isRotating, setIsRotating] = useState(true);
  // The render loop below is created once by an effect keyed on [height]
  // (recreating the whole THREE.js scene on every isRotating toggle would be
  // wasteful and would restart the camera/lighting setup) — so it can't read
  // `isRotating` state directly without capturing a stale closure. Keep a
  // ref in sync with the state instead and read that inside the loop.
  const isRotatingRef = useRef(isRotating);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<"style" | "fabric" | "color">("style");
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // Generate procedural canvas texture for Ankara Wax Print pattern
  const createAnkaraTexture = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = selectedColorHex;
    ctx.fillRect(0, 0, 512, 512);

    // African geometric wax motifs
    ctx.strokeStyle = "#F2A93B";
    ctx.lineWidth = 6;
    for (let x = 0; x < 512; x += 64) {
      for (let y = 0; y < 512; y += 64) {
        ctx.beginPath();
        ctx.arc(x + 32, y + 32, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#E06B3E";
        ctx.fillRect(x + 24, y + 24, 16, 16);

        ctx.beginPath();
        ctx.moveTo(x, y + 32);
        ctx.lineTo(x + 32, y);
        ctx.lineTo(x + 64, y + 32);
        ctx.lineTo(x + 32, y + 64);
        ctx.closePath();
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }, [selectedColorHex]);

  // Morphology proportion scale ratios
  const getMorphologyScales = useCallback((shape: MorphologyShape) => {
    switch (shape) {
      case "hourglass":
        return { shoulder: 1.05, bust: 1.08, waist: 0.82, hip: 1.12 };
      case "rectangle":
        return { shoulder: 1.0, bust: 0.98, waist: 0.96, hip: 1.0 };
      case "pear":
        return { shoulder: 0.92, bust: 0.94, waist: 0.88, hip: 1.25 };
      case "inverted-triangle":
        return { shoulder: 1.22, bust: 1.14, waist: 0.88, hip: 0.92 };
      case "oval":
        return { shoulder: 0.98, bust: 1.05, waist: 1.18, hip: 1.06 };
      default:
        return { shoulder: 1.0, bust: 1.0, waist: 1.0, hip: 1.0 };
    }
  }, []);

  // Build Procedural Mannequin Anatomy
  const buildMannequinGeometry = useCallback((shape: MorphologyShape) => {
    const scales = getMorphologyScales(shape);
    const points: THREE.Vector2[] = [];

    // Profile of female fashion dressform from base to neck (Y: -2.2 to 2.2)
    // base stand
    points.push(new THREE.Vector2(0.01, -2.2));
    points.push(new THREE.Vector2(0.35, -2.2));
    points.push(new THREE.Vector2(0.05, -2.1));
    points.push(new THREE.Vector2(0.05, -1.2)); // stand pole

    // thigh / lower hip
    points.push(new THREE.Vector2(0.48 * scales.hip, -0.9));
    // widest hip
    points.push(new THREE.Vector2(0.56 * scales.hip, -0.45));
    // high hip
    points.push(new THREE.Vector2(0.51 * scales.hip, -0.15));
    // natural waist
    points.push(new THREE.Vector2(0.38 * scales.waist, 0.25));
    // ribcage
    points.push(new THREE.Vector2(0.44 * scales.bust, 0.6));
    // full bust
    points.push(new THREE.Vector2(0.54 * scales.bust, 0.95));
    // upper chest
    points.push(new THREE.Vector2(0.50 * scales.shoulder, 1.25));
    // shoulder line
    points.push(new THREE.Vector2(0.62 * scales.shoulder, 1.48));
    // neck base
    points.push(new THREE.Vector2(0.24, 1.6));
    // neck cylinder
    points.push(new THREE.Vector2(0.22, 1.95));
    // crown top finial
    points.push(new THREE.Vector2(0.25, 2.05));
    points.push(new THREE.Vector2(0.12, 2.2));
    points.push(new THREE.Vector2(0.01, 2.25));

    return new THREE.LatheGeometry(points, 36);
  }, [getMorphologyScales]);

  // Build Procedural Garment Geometry based on Style & Morphology
  const buildGarmentGeometry = useCallback((styleId: string, shape: MorphologyShape) => {
    const scales = getMorphologyScales(shape);
    const points: THREE.Vector2[] = [];

    if (styleId === "wrap-dress") {
      // Wrap Midi: hugs bust & waist, then flares into midi skirt
      points.push(new THREE.Vector2(0.72 * scales.hip, -1.35)); // flared hem
      points.push(new THREE.Vector2(0.65 * scales.hip, -0.8));
      points.push(new THREE.Vector2(0.58 * scales.hip, -0.4));
      points.push(new THREE.Vector2(0.40 * scales.waist, 0.25)); // cinched waist
      points.push(new THREE.Vector2(0.47 * scales.bust, 0.65));
      points.push(new THREE.Vector2(0.57 * scales.bust, 0.95)); // bust wrap
      points.push(new THREE.Vector2(0.42 * scales.shoulder, 1.35)); // V-neck wrap line
      points.push(new THREE.Vector2(0.32, 1.45));
    } else if (styleId === "structured-blazer") {
      // Structured jacket with shoulder pads & lapels
      points.push(new THREE.Vector2(0.54 * scales.hip, -0.55)); // jacket hem below hip
      points.push(new THREE.Vector2(0.56 * scales.hip, -0.2));
      points.push(new THREE.Vector2(0.44 * scales.waist, 0.25)); // tailored suppression
      points.push(new THREE.Vector2(0.52 * scales.bust, 0.7));
      points.push(new THREE.Vector2(0.58 * scales.bust, 1.0));
      points.push(new THREE.Vector2(0.68 * scales.shoulder, 1.48)); // padded structured shoulder
      points.push(new THREE.Vector2(0.35, 1.55)); // lapel collar
    } else if (styleId === "boatneck-gown") {
      // High neckline + floor bell flare
      points.push(new THREE.Vector2(0.88 * scales.hip, -1.6)); // bell skirt hem
      points.push(new THREE.Vector2(0.74 * scales.hip, -1.1));
      points.push(new THREE.Vector2(0.60 * scales.hip, -0.4));
      points.push(new THREE.Vector2(0.41 * scales.waist, 0.25));
      points.push(new THREE.Vector2(0.55 * scales.bust, 0.95));
      points.push(new THREE.Vector2(0.64 * scales.shoulder, 1.45)); // bateau wide boatneck
      points.push(new THREE.Vector2(0.55, 1.52));
    } else if (styleId === "empire-maxi") {
      // High waistline below bust with vertical drop
      points.push(new THREE.Vector2(0.78 * scales.hip, -1.6));
      points.push(new THREE.Vector2(0.68 * scales.hip, -0.9));
      points.push(new THREE.Vector2(0.58 * scales.hip, -0.2));
      points.push(new THREE.Vector2(0.50 * scales.waist, 0.5)); // raised empire waist
      points.push(new THREE.Vector2(0.56 * scales.bust, 0.95));
      points.push(new THREE.Vector2(0.48 * scales.shoulder, 1.4));
      points.push(new THREE.Vector2(0.3, 1.5));
    } else {
      // Peplum suit: fitted waist, outward peplum skirt at hip
      points.push(new THREE.Vector2(0.52 * scales.hip, -1.2)); // pencil skirt bottom
      points.push(new THREE.Vector2(0.54 * scales.hip, -0.5));
      points.push(new THREE.Vector2(0.74 * scales.hip, -0.15)); // flared peplum wave
      points.push(new THREE.Vector2(0.40 * scales.waist, 0.25)); // sharp cinch
      points.push(new THREE.Vector2(0.55 * scales.bust, 0.95));
      points.push(new THREE.Vector2(0.65 * scales.shoulder, 1.48));
      points.push(new THREE.Vector2(0.32, 1.52));
    }

    return new THREE.LatheGeometry(points, 36);
  }, [getMorphologyScales]);

  // Three.js Scene Initialization
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const heightPx = height;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Studio key light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill light (cool tone)
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    fillLight.position.set(-4, 3, 2);
    scene.add(fillLight);

    // Rim / Hair light for garment silhouette definition
    const rimLight = new THREE.DirectionalLight(0xfef08a, 1.8);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Ground shadow receiver
    const shadowGeo = new THREE.CircleGeometry(2.0, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.12 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.25;
    scene.add(shadowMesh);

    // Model Group for rotation
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (isRotatingRef.current && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.007;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(w, heightPx);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [height]);

  // Update Geometry & Materials when Props Change
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return;
    const group = modelGroupRef.current;

    // Clear old meshes
    while (group.children.length > 0) {
      const obj = group.children[0];
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
      group.remove(obj);
    }

    // 1. Mannequin Mesh (Linen-wrapped atelier dressmaker body)
    const mannequinGeo = buildMannequinGeometry(morphology);
    const mannequinMat = new THREE.MeshStandardMaterial({
      color: 0xE8DFD5,
      roughness: 0.85,
      metalness: 0.05,
    });
    const mannequinMesh = new THREE.Mesh(mannequinGeo, mannequinMat);
    mannequinMesh.castShadow = true;
    mannequinMesh.receiveShadow = true;
    group.add(mannequinMesh);
    mannequinMeshRef.current = mannequinMesh;

    // Stand accents (metallic bronze base ring and neck finial)
    const finialGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 16);
    const finialMat = new THREE.MeshStandardMaterial({ color: 0xC49A45, roughness: 0.25, metalness: 0.8 });
    const finialMesh = new THREE.Mesh(finialGeo, finialMat);
    finialMesh.position.y = 2.2;
    group.add(finialMesh);

    // 2. Garment Mesh
    const garmentGeo = buildGarmentGeometry(selectedStyleId, morphology);
    const fabricCfg = FABRIC_OPTIONS.find((f) => f.id === selectedFabricId) || FABRIC_OPTIONS[0];

    let garmentMat: THREE.Material;

    if (fabricCfg.textureType === "ankara") {
      const ankaraTex = createAnkaraTexture();
      garmentMat = new THREE.MeshStandardMaterial({
        map: ankaraTex,
        roughness: fabricCfg.roughness,
        metalness: fabricCfg.metalness,
        side: THREE.DoubleSide,
      });
    } else if (fabricCfg.textureType === "silk") {
      garmentMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(selectedColorHex),
        roughness: 0.18,
        metalness: 0.1,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
        reflectivity: 0.9,
        side: THREE.DoubleSide,
      });
    } else if (fabricCfg.textureType === "velvet") {
      garmentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(selectedColorHex),
        roughness: 0.6,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });
    } else {
      garmentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(selectedColorHex),
        roughness: fabricCfg.roughness,
        metalness: fabricCfg.metalness,
        side: THREE.DoubleSide,
      });
    }

    const garmentMesh = new THREE.Mesh(garmentGeo, garmentMat);
    garmentMesh.castShadow = true;
    garmentMesh.receiveShadow = true;
    // Layer slightly outside mannequin
    garmentMesh.scale.set(1.025, 1.0, 1.025);
    group.add(garmentMesh);
    garmentMeshRef.current = garmentMesh;
  }, [morphology, selectedStyleId, selectedFabricId, selectedColorHex, buildMannequinGeometry, buildGarmentGeometry, createAnkaraTexture]);

  // Interactive Drag-to-Rotate and Wheel-to-Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !modelGroupRef.current) return;
    const deltaX = e.clientX - mousePosRef.current.x;
    const deltaY = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    modelGroupRef.current.rotation.y += deltaX * 0.012;
    modelGroupRef.current.rotation.x = Math.max(-0.25, Math.min(0.25, modelGroupRef.current.rotation.x + deltaY * 0.005));
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsRotating(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDownRef.current || !modelGroupRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - mousePosRef.current.x;
    const deltaY = e.touches[0].clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    modelGroupRef.current.rotation.y += deltaX * 0.012;
    modelGroupRef.current.rotation.x = Math.max(
      -0.25,
      Math.min(0.25, modelGroupRef.current.rotation.x + deltaY * 0.005)
    );
  };

  const handleTouchEnd = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const newZ = Math.max(3.6, Math.min(7.2, cameraRef.current.position.z + e.deltaY * 0.003));
    cameraRef.current.position.z = newZ;
    setZoomLevel(Number(((7.2 - newZ) / 3.6).toFixed(2)));
  };

  const resetCamera = () => {
    if (cameraRef.current && modelGroupRef.current) {
      cameraRef.current.position.set(0, 0.2, 5.2);
      modelGroupRef.current.rotation.set(0, 0, 0);
      setIsRotating(true);
    }
  };

  const currentStyle = GARMENT_STYLES.find((s) => s.id === selectedStyleId) || GARMENT_STYLES[0];
  const isRecommended = currentStyle.recommendedFor.includes(morphology);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border" style={{ borderColor: C.parchmentDark, background: C.white }}>
      {/* 3D Canvas Header Bar */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: C.parchmentDark, background: C.parchment }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: C.forest, color: "#fff" }}>
            <AppIcon name="layers" size={14} />
          </span>
          <div>
            <span style={{ fontFamily: FONT.serif, color: C.ink }} className="text-sm font-semibold">Morphology 3D Atelier</span>
            <span style={{ fontFamily: FONT.mono, color: C.inkSubtle }} className="ml-2 text-[10px] uppercase tracking-wider">
              {morphology.toUpperCase()} FORM
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isRecommended ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(26, 77, 62, 0.12)", color: C.forest, fontFamily: FONT.mono }}
            >
              <AppIcon name="sparkles" size={11} /> Ideal Match
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={{ background: C.parchmentDark, color: C.inkMuted, fontFamily: FONT.mono }}
            >
              Custom Fitting
            </span>
          )}

          <button
            onClick={() => setIsRotating(!isRotating)}
            aria-label="Toggle 360 rotation"
            className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:bg-white"
            style={{ borderColor: C.parchmentDark, color: isRotating ? C.forest : C.inkMuted }}
            title={isRotating ? "Pause 360° rotation" : "Start 360° rotation"}
          >
            <AppIcon name={isRotating ? "pause" : "play"} size={13} />
          </button>

          <button
            onClick={resetCamera}
            aria-label="Reset 3D camera"
            className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:bg-white"
            style={{ borderColor: C.parchmentDark, color: C.inkMuted }}
            title="Reset viewing angle"
          >
            <AppIcon name="refresh" size={13} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{
          height,
          background:
            "radial-gradient(circle at 50% 40%, rgba(245, 240, 230, 0.8) 0%, rgba(235, 227, 215, 0.9) 100%)",
          touchAction: "none",
        }}
      >
        {/* Floating Controls Overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="pointer-events-auto rounded-2xl border border-parchment-dark bg-surface/90 backdrop-blur-md px-4 py-2.5 shadow-md">
            <div className="text-xs font-bold font-display text-ink">{currentStyle.name}</div>
            <div className="mt-0.5 text-[11px] font-body text-ink-muted">{currentStyle.accentCut}</div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-parchment-dark bg-surface/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-data text-ink-subtle shadow-md">
            <AppIcon name="compass" size={13} />
            <span>Drag 360° • Zoom</span>
          </div>
        </div>
      </div>

      {/* Interactive Customization Studio Controls */}
      {interactive && (
        <div className="border-t p-5" style={{ borderColor: C.parchmentDark, background: C.white }}>
          {/* Tabs */}
          <div className="mb-4 flex gap-2 border-b pb-3" style={{ borderColor: C.parchmentDark }}>
            {(["style", "fabric", "color"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all"
                style={{
                  fontFamily: FONT.mono,
                  background: activeTab === tab ? C.forest : "transparent",
                  color: activeTab === tab ? "#fff" : C.inkMuted,
                }}
              >
                {tab === "style" ? "1. Silhouette" : tab === "fabric" ? "2. Drape & Fabric" : "3. Hue"}
              </button>
            ))}
          </div>

          {/* Sub-panels */}
          {activeTab === "style" && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {GARMENT_STYLES.map((style) => {
                const match = style.recommendedFor.includes(morphology);
                const active = style.id === selectedStyleId;
                return (
                  <button
                    key={style.id}
                    onClick={() => onStyleChange?.(style.id)}
                    className="flex flex-col items-start rounded-2xl border p-3 text-left transition-all hover:border-[var(--color-forest)]"
                    style={{
                      borderColor: active ? C.forest : C.parchmentDark,
                      background: active ? C.parchment : C.white,
                      boxShadow: active ? `0 0 0 2px ${C.forest}` : "none",
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span style={{ fontFamily: FONT.serif, color: C.ink }} className="text-xs font-bold">{style.name}</span>
                      {match && (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "rgba(26, 77, 62, 0.15)", color: C.forest, fontFamily: FONT.mono }}>
                          Top Pick
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: FONT.sans, color: C.inkMuted }} className="mt-1 text-[11px] line-clamp-2 leading-relaxed">
                      {style.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "fabric" && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {FABRIC_OPTIONS.map((fabric) => {
                const active = fabric.id === selectedFabricId;
                return (
                  <button
                    key={fabric.id}
                    onClick={() => onFabricChange?.(fabric.id)}
                    className="flex flex-col items-start rounded-2xl border p-3 text-left transition-all hover:border-[var(--color-forest)]"
                    style={{
                      borderColor: active ? C.forest : C.parchmentDark,
                      background: active ? C.parchment : C.white,
                      boxShadow: active ? `0 0 0 2px ${C.forest}` : "none",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: fabric.textureType === "ankara" ? "linear-gradient(45deg, #E06B3E, #F2A93B)" : selectedColorHex }} />
                      <span style={{ fontFamily: FONT.sans, color: C.ink }} className="text-xs font-semibold">{fabric.name}</span>
                    </div>
                    <p style={{ fontFamily: FONT.sans, color: C.inkMuted }} className="mt-1 text-[11px] leading-relaxed">
                      {fabric.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "color" && (
            <div className="flex flex-wrap items-center gap-3">
              {COLOR_SWATCHES.map((swatch) => {
                const active = swatch.hex.toLowerCase() === selectedColorHex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    onClick={() => onColorChange?.(swatch.hex)}
                    className="flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all hover:scale-105"
                    style={{
                      borderColor: active ? C.forest : C.parchmentDark,
                      background: active ? C.parchment : C.white,
                      boxShadow: active ? `0 0 0 2px ${C.forest}` : "none",
                    }}
                  >
                    <span className="h-4 w-4 rounded-full border border-black/10 shadow-sm" style={{ background: swatch.hex }} />
                    <span style={{ fontFamily: FONT.sans, color: C.ink }} className="text-xs font-medium">{swatch.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

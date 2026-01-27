import mapboxgl from "mapbox-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Pin = { id: string; lng: number; lat: number };

export function createPinsLayer(pins: Pin[]): mapboxgl.CustomLayerInterface {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  let renderer: THREE.WebGLRenderer;
  let mapInstance: mapboxgl.Map;
  const DESIRED_PIN_HEIGHT_METERS = 35;
  const MIN_BOUNDS_EPS = 1e-6;

  const applyPinVisualOverrides = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = false;
        child.renderOrder = 10;
        const forcedMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x2cfffe,
          emissiveIntensity: 0.9,
          metalness: 0.2,
          roughness: 0.3,
        });
        child.material = forcedMaterial;
        child.material.depthTest = false;
        child.material.depthWrite = false;
      }
    });
  };

  const addFallbackPin = (p: Pin) => {
    const mc = mapboxgl.MercatorCoordinate.fromLngLat(
      { lng: p.lng, lat: p.lat },
      0
    );
    const metersToMercator = mc.meterInMercatorCoordinateUnits();
    const scaleScalar = (DESIRED_PIN_HEIGHT_METERS * metersToMercator) / 1.2;
    const geometry = new THREE.ConeGeometry(0.4, 1.2, 12);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4d4f,
      emissive: 0x550000,
      roughness: 0.4,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const lift = (1.2 * scaleScalar) / 2;
    mesh.position.set(mc.x, mc.y, mc.z + lift);
    mesh.scale.setScalar(scaleScalar);
    mesh.rotation.x = Math.PI / 2;
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    material.depthTest = false;
    material.depthWrite = false;
    scene.add(mesh);
  };

  return {
    id: "three-pins",
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      mapInstance = map;

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // 💡 조명
      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(0, 10, 10);
      scene.add(dir);

      // ============================
      // ⭐ GLTF 핀 로드 (여기!!)
      // ============================
      const loader = new GLTFLoader();
      loader.load("/models/pin.glb", (gltf) => {
        console.log("[pin.glb] loaded", gltf);
        const baseModel = gltf.scene;
        console.log("[pin.glb] children", baseModel.children.length);

        for (const p of pins) {
          const obj = baseModel.clone(true);
          obj.position.set(0, 0, 0);

          const mc = mapboxgl.MercatorCoordinate.fromLngLat(
            { lng: p.lng, lat: p.lat },
            0
          );

          const bounds = new THREE.Box3().setFromObject(obj);
          const size = new THREE.Vector3();
          bounds.getSize(size);
          console.log("[pin.glb] base size", size);

          if (size.y < MIN_BOUNDS_EPS) {
            console.warn("[pin.glb] bounds too small, using fallback pin");
            addFallbackPin(p);
            continue;
          }

          const center = new THREE.Vector3();
          bounds.getCenter(center);
          obj.position.sub(center);
          console.log("[pin.glb] center", center);

          const metersToMercator = mc.meterInMercatorCoordinateUnits();
          const scaleScalar = (DESIRED_PIN_HEIGHT_METERS * metersToMercator) / size.y;
          const group = new THREE.Group();
          group.add(obj);

          const lift = (size.y * scaleScalar) / 2;
          group.position.set(mc.x, mc.y, mc.z + lift);
          group.scale.set(scaleScalar, scaleScalar, scaleScalar);

          // ⚠️ 모델 방향 보정 (대부분 필요)
          group.rotation.x = Math.PI / 2;
          console.log("[pin.glb] rotations", group.rotation);
          applyPinVisualOverrides(group);
          scene.add(group);
        }
        mapInstance.triggerRepaint();
      }, undefined, (error) => {
        console.error("[pin.glb] failed to load", error);
        pins.forEach(addFallbackPin);
        mapInstance.triggerRepaint();
      });
    },

    render(gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix as any);
      camera.projectionMatrix = m;

      renderer.resetState();
      renderer.clearDepth();
      renderer.render(scene, camera);

      mapInstance.triggerRepaint();
    },
  };
}

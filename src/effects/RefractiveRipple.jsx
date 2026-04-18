import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;

  uniform sampler2D uSceneTexture;
  uniform float uTime;
  uniform float uProgress;
  uniform float uDistortionStrength;
  uniform vec2 uResolution;

  varying vec2 vUv;

  void main() {
    vec2 screenUv = gl_FragCoord.xy / uResolution;

    vec2 d = vUv - 0.5;
    float r2 = dot(d, d);

    // BARDZIEJ PRZEZROCZYSTA MASKA
    // Zmniejszamy zakres smoothstep, aby krawędź była czystsza
    float mask = smoothstep(0.25, 0.24, r2);

    float invR = inversesqrt(r2 + 1e-5);
    vec2 dir = d * invR;
    float r = r2 * invR;

    // FADEOUT
    float fade = (1.0 - uProgress);
    float fadeOut = pow(fade, 2.0); // Szybsze znikanie dla lekkości

    // FALA (Wyższy garb x2)
    // Sinus steruje przesunięciem UV
    float wave = sin(r * 25.0 - uTime * 10.0) * 2.0; 
    
    // Siła zniekształcenia (Refrakcja)
    float distIntensity = uDistortionStrength * fadeOut * mask;

    // Próbkowanie tła ze zniekształceniem
    vec2 distortedUv = screenUv + dir * wave * distIntensity;
    vec3 bg = texture2D(uSceneTexture, distortedUv).rgb;

    // FINALNA ALFA
    // Mnożymy przez 0.6, aby efekt był bardziej "szklany" i przezroczysty od samego początku
    float finalAlpha = fadeOut * mask * 0.6;

    gl_FragColor = vec4(bg, finalAlpha);
  }
`;

const RefractiveRipple = ({
  position = [0, 0, 0],
  duration = 4.5,
  strength = 0.01, // Nieco mniejsza siła dla czystszego obrazu
  onComplete,
}) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { gl, scene, camera, size } = useThree();

  const animState = useRef({ startTime: -1, done: false });
  const capturedOnce = useRef(false);
  const rtScale = 0.5; 

  const renderTarget = useMemo(() => {
    return new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(size.width * rtScale)),
      Math.max(1, Math.floor(size.height * rtScale)),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat, // Upewniamy się, że mamy kanał alfa
        depthBuffer: false,
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderTarget.setSize(
      Math.max(1, Math.floor(size.width * rtScale)),
      Math.max(1, Math.floor(size.height * rtScale))
    );
  }, [size.width, size.height, renderTarget, rtScale]);

  const MAX_RADIUS = 0.45; 
  const START_SCALE = 0.15;

  const uniforms = useMemo(
    () => ({
      uSceneTexture: { value: null },
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uDistortionStrength: { value: strength },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    []
  );

  useFrame((state) => {
    if (animState.current.done || !meshRef.current || !materialRef.current) return;

    if (animState.current.startTime === -1) {
      animState.current.startTime = state.clock.getElapsedTime();
      capturedOnce.current = false;
    }

    const currentTime = state.clock.getElapsedTime();
    const elapsed = currentTime - animState.current.startTime;
    const progress = Math.min(elapsed / duration, 1);

    const mat = materialRef.current;
    mat.uniforms.uTime.value = currentTime;
    mat.uniforms.uProgress.value = progress;
    mat.uniforms.uResolution.value.set(size.width, size.height);

    if (!capturedOnce.current) {
      meshRef.current.visible = false;
      gl.setRenderTarget(renderTarget);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
      meshRef.current.visible = true;
      mat.uniforms.uSceneTexture.value = renderTarget.texture;
      capturedOnce.current = true;
    }

    const currentScale = THREE.MathUtils.lerp(START_SCALE, 1.0, progress);
    meshRef.current.scale.set(currentScale, currentScale, 1);

    if (progress >= 1) {
      animState.current.done = true;
      renderTarget.dispose();
      onComplete?.();
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[MAX_RADIUS, 16]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending} // Standardowe mieszanie dla czystości
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default RefractiveRipple;
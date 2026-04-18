import React, { useRef } from 'react';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

const BoarderGelMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uEnv: null,
    uColorTop: new THREE.Color('#ffffff'),
    uColorMid: new THREE.Color('#fee1f0'),
    uColorBot: new THREE.Color('#f2a6e4'),
    uGradientStretch: 20.0,
    uGlitterDensity: 50.0,
    uGlitterSize: 0.2,
    uRefractionRatio: 1.6,
    uGlassThickness: 0.6,
    uEnvReflection: 0.1,
    uOpacity: 1.0,
    uAoColor: new THREE.Color('#9900ff'),
    uAoIntensity: 0.5,
    
    // Ręczne dodanie uniformów mgły, których szuka renderer Three.js
    // To zapobiega błędom TypeError i pozwala na użycie fog={true}
    fogColor: new THREE.Color('#ffffff'),
    fogNear: 0,
    fogFar: 0,
    fogDensity: 0.00025
  },
  // Vertex Shader
  `
  #include <common>
  #include <fog_pars_vertex>

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying float vFakeAO;

  void main() {
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    
    vec4 mvPosition = viewMatrix * worldPosition;
    vViewPosition = -mvPosition.xyz;

    vFakeAO = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
    
    gl_Position = projectionMatrix * mvPosition;

    #include <fog_vertex>
  }
  `,
  // Fragment Shader
  `
  #include <common>
  #include <fog_pars_fragment>

  uniform sampler2D uEnv;
  uniform vec3 uColorTop, uColorMid, uColorBot, uAoColor;
  uniform float uTime, uGradientStretch, uOpacity, uGlitterDensity, uGlitterSize, uRefractionRatio, uGlassThickness, uEnvReflection, uAoIntensity;
  
  varying vec3 vNormal, vViewPosition, vWorldPosition;
  varying float vFakeAO;

  float rand(vec3 co) { return fract(sin(dot(co, vec3(12.9898, 78.233, 144.7232))) * 43758.5453); }
  
  float noise3D(vec3 p) {
    vec3 ip = floor(p); vec3 fp = fract(p);
    fp = fp * fp * (3.0 - 2.0 * fp);
    float n000 = rand(ip); float n100 = rand(ip + vec3(1,0,0));
    float n010 = rand(ip + vec3(0,1,0)); float n110 = rand(ip + vec3(1,1,0));
    float n001 = rand(ip + vec3(0,0,1)); float n101 = rand(ip + vec3(1,0,1));
    float n011 = rand(ip + vec3(0,1,1)); float n111 = rand(ip + vec3(1,1,1));
    float n0 = mix(mix(n000, n100, fp.x), mix(n010, n110, fp.x), fp.y);
    float n1 = mix(mix(n001, n101, fp.x), mix(n011, n111, fp.x), fp.y);
    return mix(n0, n1, fp.z);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 reflectDir = reflect(-viewDir, normal);

    vec2 envUV = vec2(atan(reflectDir.z, reflectDir.x) / 6.283185 + 0.5, 1.0 - (acos(reflectDir.y) / 3.1415926));
    vec3 envColor = texture2D(uEnv, envUV).rgb;

    float fresnel = pow(1.0 - dot(normal, viewDir), uGlassThickness);

    float wave = sin(vWorldPosition.y * uGradientStretch + uTime) * 0.2;
    float gelMix = clamp(normal.y + wave + 0.5, 0.0, 1.0);
    vec3 gelColor = mix(mix(uColorBot, uColorMid, smoothstep(0.0, 0.5, gelMix)), uColorTop, smoothstep(0.5, 1.0, gelMix));
    
    gelColor = mix(gelColor, envColor, uEnvReflection * 0.3);

    vec3 refrPos = vWorldPosition - reflect(viewDir, normal) * uRefractionRatio * 0.1;
    float gNoise = noise3D(refrPos * uGlitterDensity + uTime * 0.05);
    float sparkle = smoothstep(1.0 - uGlitterSize, 1.0 - uGlitterSize + 0.02, gNoise);
    
    vec3 finalInterior = mix(gelColor, vec3(1.0), sparkle * 0.9);
    finalInterior = mix(finalInterior, uAoColor, (1.0 - vFakeAO) * uAoIntensity);

    vec3 color = mix(finalInterior, envColor, fresnel * uEnvReflection);
    color += envColor * fresnel * 0.5;

    gl_FragColor = vec4(color, uOpacity);

    #include <fog_fragment>
  }
  `
);

extend({ BoarderGelMaterialImpl });

export const BoarderGelGlitterMaterial = (props) => {
  const matRef = useRef();
  
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime * 1.19;
    }
  });

  return (
    <boarderGelMaterialImpl 
      ref={matRef} 
      transparent 
      fog={true} 
      {...props} 
    />
  );
};
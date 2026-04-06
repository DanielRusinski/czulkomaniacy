import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GlobalShadowFix = () => {
  const { gl } = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.shadowMap.enabled = true;
    
    Object.defineProperty(gl.shadowMap, 'type', {
      get: () => THREE.PCFShadowMap, 
      set: () => { }, 
      configurable: true
    });
  }, [gl]);
  return null;
};

export default GlobalShadowFix;
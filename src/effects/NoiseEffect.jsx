import React from 'react';
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export const NoiseEffect = () => {
  return (
    <EffectComposer disableNormalPass>
      {/* Subtelny szum:
        - premultiply={false} sprawia, że ziarno nie jest tak "ostre"
        - opacity={0.12} sprawia, że efekt jest na granicy widoczności, co daje filmowy sznyt bez irytującego migotania
      */}
      <Noise 
        premultiply={false} 
        blendFunction={BlendFunction.SOFT_LIGHT} 
        opacity={0.12} 
      />
      
      {/* Dodanie lekkiej winiety pomaga "ustabilizować" obraz wizualnie, 
        skupiając wzrok na środku i sprawiając, że szum na krawędziach jest mniej odczuwalny.
      */}
      <Vignette 
        eskil={false} 
        offset={0.5} 
        darkness={0.4} 
      />
    </EffectComposer>
  );
};
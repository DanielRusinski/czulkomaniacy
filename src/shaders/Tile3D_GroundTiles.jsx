import * as THREE from 'three';

// Pusta, biała tekstura zapobiegająca błędom WebGL, zanim EXR się załaduje
const dummyEnvMap = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
dummyEnvMap.needsUpdate = true;

/**
 * Modyfikuje oryginalny materiał z pliku GLB dodając obsługę:
 * 1. Proceduralnego szumu (Noise)
 * 2. Pobierania oświetlenia ambientowego bezpośrednio z mapy EXR
 */
export function createGroundShader(baseMaterial) {
    const material = baseMaterial.clone();

    // Tworzymy obiekt w userData, aby móc go bezpiecznie aktualizować z zewnątrz
    material.userData.shaderUniforms = {
        customEnvMap: { value: dummyEnvMap }
    };

    material.onBeforeCompile = (shader) => {
        // Rejestracja naszego dynamicznego uniformu
        shader.uniforms.customEnvMap = material.userData.shaderUniforms.customEnvMap;

        // --- VERTEX SHADER ---
        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormalCustom;
            `
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <worldpos_vertex>',
            `
            #include <worldpos_vertex>
            
            // Three.js w bloku worldpos_vertex automatycznie oblicza zmienną 'worldPosition' 
            // uwzględniając instancing, więc bezpiecznie z niej korzystamy:
            vWorldPosition = worldPosition.xyz;
            
            // Zabezpieczamy obliczanie wektora normalnego przed błędem kompilacji
            #ifdef USE_INSTANCING
                vWorldNormalCustom = normalize(mat3(modelMatrix * instanceMatrix) * normal);
            #else
                vWorldNormalCustom = normalize(mat3(modelMatrix) * normal);
            #endif
            `
        );

        // --- FRAGMENT SHADER ---
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormalCustom;
            uniform sampler2D customEnvMap;

            const float PI = 3.14159265359;
            vec2 getEquirectangularUv(vec3 dir) {
                float phi = acos(-dir.y);
                float theta = atan(dir.z, dir.x) + PI;
                return vec2(theta / (2.0 * PI), phi / PI);
            }

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            
            // Wbudowany <color_fragment> w Three.js już nałożył kolor instancji (instanceColor) 
            // na zmienną diffuseColor. My dodajemy tylko proceduralny szum organiczny.
            
            float noise = random(floor(vWorldPosition.xz * 1.5)); 
            float brightness = mix(0.85, 1.15, noise);
            
            diffuseColor.rgb *= brightness;
            `
        );

        // Dodajemy customowe oświetlenie z mapy EXR na samym końcu potoku renderowania
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            
            vec3 envDir = normalize(vWorldNormalCustom);
            vec2 envUv = getEquirectangularUv(envDir);
            
            vec3 ambientFromEXR = texture2D(customEnvMap, envUv).rgb;
            ambientFromEXR = max(ambientFromEXR, vec3(0.05)); 

            // Bezpiecznie modyfikujemy finalny piksel gl_FragColor zamiast diffuseColor
            gl_FragColor.rgb *= (1.0 + ambientFromEXR * 0.6); 
            `
        );
    };

    return material;
>>>>>>> d497139269f04c664bac1368ec93cf222b160590
}
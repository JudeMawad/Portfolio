import { CUBE_LED_MATRIX_SIZE, createCubeLedFrameGenerator } from "../../shared/scripts/cube-led-frames.js";

const MATRIX_SIZE = CUBE_LED_MATRIX_SIZE;
const PIXEL_COUNT = MATRIX_SIZE * MATRIX_SIZE;

const createLedCoordinateAttribute = (THREE, geometry) => {
  const positions = geometry.getAttribute("position");
  if (!positions || positions.itemSize !== 3) {
    throw new Error("Cube LED mesh requires a three-component position attribute");
  }

  const coordinates = new Float32Array(positions.count * 2);
  const verticesPerPixel = new Uint16Array(PIXEL_COUNT);

  for (let index = 0; index < positions.count; index += 1) {
    // The GLB stores columns along local +X and rows bottom-to-top along local -Z.
    // The source program addresses its matrix from the top-left, so Y is flipped once here.
    const sourceX = Math.round(positions.getX(index) / 4);
    const geometryRow = Math.round(-positions.getZ(index) / 4);
    const sourceY = MATRIX_SIZE - 1 - geometryRow;

    if (
      sourceX < 0 || sourceX >= MATRIX_SIZE ||
      sourceY < 0 || sourceY >= MATRIX_SIZE
    ) {
      throw new Error(`Cube LED vertex ${index} falls outside the 64x64 matrix`);
    }

    coordinates[index * 2] = sourceX;
    coordinates[index * 2 + 1] = sourceY;
    verticesPerPixel[sourceY * MATRIX_SIZE + sourceX] += 1;
  }

  let mappedPixelCount = 0;
  let minimumVerticesPerPixel = Number.POSITIVE_INFINITY;
  let maximumVerticesPerPixel = 0;
  verticesPerPixel.forEach((count) => {
    if (count > 0) mappedPixelCount += 1;
    minimumVerticesPerPixel = Math.min(minimumVerticesPerPixel, count);
    maximumVerticesPerPixel = Math.max(maximumVerticesPerPixel, count);
  });

  if (mappedPixelCount !== PIXEL_COUNT) {
    throw new Error(`Cube LED mapping resolved ${mappedPixelCount} of ${PIXEL_COUNT} pixels`);
  }

  geometry.setAttribute("cubeLedCoord", new THREE.BufferAttribute(coordinates, 2));
  return {
    mappedPixelCount,
    vertexCount: positions.count,
    minimumVerticesPerPixel,
    maximumVerticesPerPixel
  };
};

const configureLedMaterial = ({ material, texture, brightnessUniform, emissionGain }) => {
  const originalOnBeforeCompile = material.onBeforeCompile;
  const originalProgramCacheKey = material.customProgramCacheKey;
  const originalMaterialState = {
    color: material.color.clone(),
    emissive: material.emissive.clone(),
    emissiveIntensity: material.emissiveIntensity,
    metalness: material.metalness,
    roughness: material.roughness
  };

  material.color.setRGB(.01, .01, .01);
  material.emissive.setRGB(0, 0, 0);
  material.emissiveIntensity = 1;
  material.metalness = 0;
  material.roughness = .48;

  material.onBeforeCompile = function onBeforeCompile(shader, renderer) {
    originalOnBeforeCompile.call(this, shader, renderer);
    shader.uniforms.cubeLedTexture = { value: texture };
    shader.uniforms.cubeLedBrightness = brightnessUniform;
    shader.uniforms.cubeLedEmissionGain = { value: emissionGain };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec2 cubeLedCoord;\nvarying vec2 vCubeLedCoord;"
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCubeLedCoord = cubeLedCoord;"
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D cubeLedTexture;\nuniform float cubeLedBrightness;\nuniform float cubeLedEmissionGain;\nvarying vec2 vCubeLedCoord;"
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        [
          "vec4 diffuseColor = vec4( diffuse, opacity );",
          `vec2 cubeLedUv = (vCubeLedCoord + 0.5) / ${MATRIX_SIZE.toFixed(1)};`,
          "vec3 cubeLedColor = texture2D(cubeLedTexture, cubeLedUv).rgb;",
          "diffuseColor.rgb = vec3(0.003) + cubeLedColor * cubeLedBrightness * 0.12;"
        ].join("\n")
      )
      .replace(
        "vec3 totalEmissiveRadiance = emissive;",
        "vec3 totalEmissiveRadiance = cubeLedColor * cubeLedBrightness * cubeLedEmissionGain;"
      );
  };

  material.customProgramCacheKey = () => `${originalProgramCacheKey.call(material)}|cube-fastled-noise-v1`;
  material.needsUpdate = true;

  return () => {
    material.color.copy(originalMaterialState.color);
    material.emissive.copy(originalMaterialState.emissive);
    material.emissiveIntensity = originalMaterialState.emissiveIntensity;
    material.metalness = originalMaterialState.metalness;
    material.roughness = originalMaterialState.roughness;
    material.onBeforeCompile = originalOnBeforeCompile;
    material.customProgramCacheKey = originalProgramCacheKey;
    material.needsUpdate = true;
  };
};

export const createCubeLedAnimation = ({
  THREE,
  mesh,
  material,
  reducedMotion = false,
  debug = false,
  emissionGain = 15
}) => {
  if (!THREE || !mesh?.isMesh || !material?.isMeshStandardMaterial) {
    throw new Error("Cube LED animation requires Three.js and the LED MeshStandardMaterial");
  }

  const mapping = createLedCoordinateAttribute(THREE, mesh.geometry);
  const brightnessUniform = { value: .1 };
  let texture = null;

  const frameGenerator = createCubeLedFrameGenerator({
    reducedMotion,
    debug,
    onFrame: (_pixelData, nextBrightness) => {
      brightnessUniform.value = nextBrightness / 100;
      if (texture) texture.needsUpdate = true;
    }
  });

  texture = new THREE.DataTexture(
    frameGenerator.pixelData,
    MATRIX_SIZE,
    MATRIX_SIZE,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  texture.name = "CubeFastLedNoise64x64";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  const restoreMaterial = configureLedMaterial({
    material,
    texture,
    brightnessUniform,
    emissionGain
  });
  let disposed = false;

  const getDiagnostics = () => ({
    ...frameGenerator.getDiagnostics(),
    mappedPixelCount: mapping.mappedPixelCount,
    vertexCount: mapping.vertexCount,
    minimumVerticesPerPixel: mapping.minimumVerticesPerPixel,
    maximumVerticesPerPixel: mapping.maximumVerticesPerPixel,
    mapping: "GLB local +X left-to-right; local -Z bottom-to-top; source Y flipped to top-left origin"
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    frameGenerator.dispose();
    mesh.geometry.deleteAttribute("cubeLedCoord");
    restoreMaterial();
    texture.dispose();
  };

  return {
    setState: frameGenerator.setState,
    setVoiceLevel: frameGenerator.setVoiceLevel,
    setReducedMotion: frameGenerator.setReducedMotion,
    setDebugMode: frameGenerator.setDebugMode,
    getDiagnostics,
    update: frameGenerator.update,
    dispose
  };
};

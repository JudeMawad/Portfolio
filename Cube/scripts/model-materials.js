const cubePartMap = Object.freeze({
  enclosure: { nodeName: "Cube", materialName: "Material" },
  ledPanel: { nodeName: "LED_Matrix", materialName: "Material.001" },
  ledPixels: { nodeName: "LEDS", materialName: "Material.004" },
  speakerGrille: { nodeName: "Speaker_Grille", materialName: "Material.003" }
});

const resolvePart = (root, definition) => {
  const mesh = root.getObjectByName(definition.nodeName);
  if (!mesh?.isMesh) throw new Error(`Missing Cube mesh: ${definition.nodeName}`);

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const material = materials.find((candidate) => candidate?.name === definition.materialName);
  if (!material?.isMeshStandardMaterial) {
    throw new Error(`Unexpected material on Cube mesh: ${definition.nodeName}`);
  }

  return { mesh, material };
};

const createPlasticBumpTexture = (THREE, renderer) => {
  const size = 256;
  const tileSize = size - 1;
  const noise = new Uint8Array(tileSize * tileSize);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  if (!context) throw new Error("Unable to create Cube material texture");

  let seed = 0x6d2b79f5;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let index = 0; index < noise.length; index += 1) {
    const fine = (random() - .5) * 20;
    const micro = (random() - .5) * 6;
    noise[index] = Math.round(128 + fine + micro);
  }

  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sourceX = x === size - 1 ? 0 : x;
      const sourceY = y === size - 1 ? 0 : y;
      const value = noise[sourceY * tileSize + sourceX];
      const offset = (y * size + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = "CubePlasticMicroBump";
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
  return texture;
};

export const configureCubeMaterials = (root, { THREE, renderer }) => {
  const parts = {
    enclosure: resolvePart(root, cubePartMap.enclosure),
    ledPanel: resolvePart(root, cubePartMap.ledPanel),
    ledPixels: resolvePart(root, cubePartMap.ledPixels),
    speakerGrille: resolvePart(root, cubePartMap.speakerGrille)
  };

  const plasticBumpTexture = createPlasticBumpTexture(THREE, renderer);
  parts.enclosure.material.metalness = 0;
  parts.enclosure.material.roughness = .66;
  parts.enclosure.material.bumpMap = plasticBumpTexture;
  parts.enclosure.material.bumpScale = 2;
  parts.enclosure.material.needsUpdate = true;

  parts.ledPanel.material.metalness = 0;
  parts.ledPanel.material.roughness = .56;

  parts.ledPixels.material.metalness = 0;
  parts.ledPixels.material.roughness = .48;

  parts.speakerGrille.material.metalness = 0;
  parts.speakerGrille.material.roughness = .62;

  return parts;
};

export const disposeModelResources = (root) => {
  if (!root) return;

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);

    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    childMaterials.filter(Boolean).forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value);
      });
    });
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
};

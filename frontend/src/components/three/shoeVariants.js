/**
 * KHR_materials_variants support for three's GLTFLoader.
 * three.js parses the extension's JSON but does not expose a switcher, so we read the
 * mappings from the parser and swap materials ourselves.
 */
export async function createVariantController(gltf) {
  const { parser } = gltf;
  const json = parser.json;
  const ext = json.extensions?.KHR_materials_variants;
  if (!ext?.variants?.length) return { names: [], apply: () => {} };

  const names = ext.variants.map((v) => v.name);
  const targets = [];

  gltf.scene.traverse((obj) => {
    if (!obj.isMesh) return;
    const assoc = parser.associations.get(obj);
    if (!assoc || assoc.meshes == null) return;
    const prim = json.meshes[assoc.meshes]?.primitives?.[assoc.primitives];
    const mappings = prim?.extensions?.KHR_materials_variants?.mappings;
    if (mappings) targets.push({ mesh: obj, mappings, original: obj.material });
  });

  const cache = new Map();
  const wanted = new Set(targets.flatMap((t) => t.mappings.map((m) => m.material)));
  await Promise.all(
    [...wanted].map(async (i) => cache.set(i, await parser.getDependency('material', i)))
  );

  return {
    names,
    apply(index) {
      for (const t of targets) {
        const hit = t.mappings.find((m) => m.variants.includes(index));
        t.mesh.material = hit ? cache.get(hit.material) : t.original;
      }
    },
  };
}

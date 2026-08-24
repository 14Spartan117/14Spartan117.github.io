import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const assetDirectory = path.resolve('assets/montford-point');
const staticAsset = 'montford-point-static.glb';
const animatedAsset = 'montford-point-deployment.glb';
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

function hierarchySignature(gltf) {
  return gltf.nodes.map((node, index) => ({
    index,
    name: node.name ?? null,
    children: node.children ?? [],
  }));
}

function collectStrings(value, strings = []) {
  if (typeof value === 'string') {
    strings.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, strings));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, strings));
  }
  return strings;
}

async function readGlb(assetName) {
  const bytes = await readFile(path.join(assetDirectory, assetName));
  assert.ok(bytes.byteLength < 15 * 1024 * 1024, `${assetName} must be below 15 MB`);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', `${assetName} must have a GLB header`);
  assert.equal(bytes.readUInt32LE(4), 2, `${assetName} must be a GLB 2.0 container`);
  assert.equal(bytes.readUInt32LE(8), bytes.byteLength, `${assetName} declared size must match its bytes`);

  const chunks = [];
  let offset = 12;
  while (offset < bytes.byteLength) {
    assert.ok(offset + 8 <= bytes.byteLength, `${assetName} has a complete chunk header`);
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    offset += 8;
    assert.ok(offset + length <= bytes.byteLength, `${assetName} chunk stays within the container`);
    assert.ok(type === JSON_CHUNK || type === BIN_CHUNK, `${assetName} has only standard GLB chunks`);
    chunks.push({ type, data: bytes.subarray(offset, offset + length) });
    offset += length;
  }
  assert.equal(offset, bytes.byteLength, `${assetName} chunks consume the container`);
  assert.equal(chunks.filter((chunk) => chunk.type === JSON_CHUNK).length, 1, `${assetName} has one JSON chunk`);
  assert.equal(chunks[0]?.type, JSON_CHUNK, `${assetName} JSON is the first chunk`);
  assert.ok(chunks.filter((chunk) => chunk.type === BIN_CHUNK).length <= 1, `${assetName} has at most one BIN chunk`);

  return {
    bytes,
    gltf: JSON.parse(chunks[0].data.toString('utf8').replace(/[\0\s]+$/, '')),
    binary: chunks.find((chunk) => chunk.type === BIN_CHUNK)?.data,
  };
}

function inputSamples(gltf, binary, sampler) {
  const accessor = gltf.accessors[sampler.input];
  const view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126, 'animation sampler inputs use float seconds');
  assert.equal(accessor.type, 'SCALAR', 'animation sampler inputs are scalar');
  assert.ok(binary, 'animation sampler inputs have a GLB BIN chunk');
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? 4;
  return {
    accessor,
    samples: Array.from({ length: accessor.count }, (_, index) => binary.readFloatLE(start + index * stride)),
  };
}

const assets = Object.fromEntries(await Promise.all(
  [staticAsset, animatedAsset].map(async (assetName) => [assetName, await readGlb(assetName)]),
));

test('Montford Point GLB JSON contains no absolute local user paths', () => {
  for (const [assetName, { gltf }] of Object.entries(assets)) {
    const localPaths = collectStrings(gltf).filter((value) => /\/(?:Users|home)\/|[A-Za-z]:\\Users\\/.test(value));
    assert.deepEqual(localPaths, [], `${assetName} exposes absolute local paths: ${localPaths.join(', ')}`);
  }
});

test('Montford Point static and animated assets retain the same node hierarchy', () => {
  assert.deepEqual(
    hierarchySignature(assets[staticAsset].gltf),
    hierarchySignature(assets[animatedAsset].gltf),
  );
});

test('Montford Point static asset has no animations', () => {
  assert.deepEqual(assets[staticAsset].gltf.animations ?? [], []);
});

test('Montford Point deployment animation is the single named release clip', () => {
  const animations = assets[animatedAsset].gltf.animations ?? [];
  assert.equal(animations.length, 1);
  assert.equal(animations[0].name, 'FOOD_CARGO_DEPLOYMENT_NOTIONAL');
});

test('Montford Point animation sampler inputs cover exactly 0 through 60 seconds', () => {
  const { gltf, binary } = assets[animatedAsset];
  for (const sampler of gltf.animations[0].samplers) {
    const { accessor, samples } = inputSamples(gltf, binary, sampler);
    assert.ok(Math.abs(samples[0]) <= 1e-6, 'sampler must start at 0 seconds');
    assert.ok(Math.abs(samples.at(-1) - 60) <= 1e-6, `sampler ends at ${samples.at(-1)}, not 60 seconds`);
    assert.ok(Math.abs(accessor.max?.[0] - 60) <= 1e-6, `sampler accessor max is ${accessor.max?.[0]}, not 60 seconds`);
  }
});

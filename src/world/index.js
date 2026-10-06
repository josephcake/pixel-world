export function createWorldObject({
  id,
  type,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  metadata = {},
}) {
  return { id, type, position, rotation, scale, metadata };
}

export function createConnectionPoint({
  id,
  ownerId,
  type,
  position,
  direction,
}) {
  return { id, ownerId, type, position, direction };
}

export function toWorldObjects(placements) {
  return placements.map((p) =>
    createWorldObject({
      id: p.id,
      type: p.item.id,
      position: [p.x, p.y, 0],
      rotation: [0, 0, (p.rotation || 0) * 90],
      metadata: { name: p.item.name, footprint: p.item.footprint },
    }),
  );
}

export function serializeWorld(objects) {
  return {
    objects: objects.map((o) => ({
      id: o.id,
      type: o.type,
      position: o.position,
      rotation: o.rotation,
      scale: o.scale,
      ...(o.metadata && Object.keys(o.metadata).length ? { metadata: o.metadata } : {}),
    })),
  };
}

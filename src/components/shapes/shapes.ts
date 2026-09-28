export type ShapeKind = 'circle' | 'triangle' | 'hexagon' | 'square'

/** Default pastel for each shape. Projects override hexagon with butter. */
export const shapeColor: Record<ShapeKind, string> = {
  circle: 'var(--mint)',
  triangle: 'var(--peach)',
  hexagon: 'var(--lavender)',
  square: 'var(--sky)',
}

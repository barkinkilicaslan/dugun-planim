/**
 * "Tarzını seç" kartlarındaki küçük resimlerin ne zaman yüklenmesi gerektiğini belirler. Kartın konumu henüz
 * ölçülmediyse yalnızca ilk `initialCount` kart (ekranın üst kısmı) yüklenir; ölçüldükten sonra görünür alanın
 * `margin` kadar yakınındaki kartlar yüklenir. Böylece altı görselin hepsi aynı anda belleğe alınmaz.
 */
export function shouldLoadThumbnail({
  index,
  top,
  height,
  scrollY,
  viewportHeight,
  margin = 240,
  initialCount = 4,
}: {
  index: number;
  top?: number;
  height?: number;
  scrollY: number;
  viewportHeight: number;
  margin?: number;
  initialCount?: number;
}): boolean {
  if (top === undefined || height === undefined || viewportHeight <= 0) return index < initialCount;
  return top + height >= scrollY - margin && top <= scrollY + viewportHeight + margin;
}

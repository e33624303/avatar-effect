function getRadian2D(pointA, pointB, pointC) {
  const segAB = Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
  const segAC = Math.sqrt((pointA.x - pointC.x) ** 2 + (pointA.y - pointC.y) ** 2);
  const segBC = Math.sqrt((pointB.x - pointC.x) ** 2 + (pointB.y - pointC.y) ** 2);
  const angleA = Math.acos((segAB ** 2 + segAC ** 2 - segBC ** 2) / (2 * segAB * segAC));
  return angleA || 0;
}

function getDistance3D(pointA, pointB) {
  const disX = (pointA.x - pointB.x) ** 2;
  const disY = (pointA.y - pointB.y) ** 2;
  const disZ = ((pointA.z - pointB.z) / 1.65) ** 2;
  return Math.sqrt(disX + disY + disZ);
}

export { getRadian2D, getDistance3D };

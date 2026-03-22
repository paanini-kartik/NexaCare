/** Short random segment for invite / join keys */
export function randomSegment(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i += 1) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function makeFamilyJoinKey() {
  return `FAM-${randomSegment(5)}`;
}

export function makeEmployerInviteKey() {
  return `EMP-${randomSegment(5)}`;
}

/** Earliest intersection fraction of a relative swept segment and a circle. */
export function sweptCircle(start,end,radius) {
  if(![start?.x,start?.z,end?.x,end?.z,radius].every(Number.isFinite)||radius<0)throw new TypeError('Invalid swept collision input.');
  const dx=end.x-start.x,dz=end.z-start.z,c=start.x**2+start.z**2-radius**2;
  if(c<=0)return 0;
  const a=dx*dx+dz*dz;if(a===0)return null;
  const b=2*(start.x*dx+start.z*dz),discriminant=b*b-4*a*c;
  if(discriminant<0)return null;
  const t=(-b-Math.sqrt(discriminant))/(2*a);
  return t>=0&&t<=1?t:null;
}

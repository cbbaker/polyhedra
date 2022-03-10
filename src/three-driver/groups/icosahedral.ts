import { Matrix3, Vector3, Quaternion } from 'three';
import { Group, GroupElement, Polyhedron } from './Group';

const phi = 0.5 * (Math.sqrt(5) + 1);
const invPhi = 0.5 * (Math.sqrt(5) - 1);
const base = new Vector3(invPhi, 0, phi);
const p1 = new Vector3(1, 1, 1);
const p2 = new Vector3(1,-1, 1);
const normal = new Vector3().crossVectors(p2.sub(base), p1.sub(base)).normalize();
const angle = Math.PI / 5;
const c = Math.cos(angle), s = Math.sin(angle);
const r = new Quaternion(normal.x * s, normal.y * s, normal.z * s, c);
const x1 = new Vector3(1, 0, 0).applyQuaternion(r).toArray();
const x2 = new Vector3(0, 1, 0).applyQuaternion(r).toArray();
const x3 = new Vector3(0, 0, 1).applyQuaternion(r).toArray();
const m = new Matrix3().fromArray([...x1, ...x2, ...x3]);


// rotation by 2pi/5 about (1,1,1)
export const a = new GroupElement(m, 'a');
// rotation by pi about (1,0,0)
export const b = new GroupElement(new Matrix3().set(
		1,  0,  0,
		0, -1,  0,
		0,  0, -1,
), 'b');

export const group = new Group([a, b]);

export const compound = new Polyhedron(group, [
		new Vector3(1, 1, 1),
		new Vector3(phi, 0, 1),
		new Vector3(phi, 0, 0),
], {
		icosadodecahedron: [
				[32, 33, 34, 36, 39],
				[32, 39, 35],
		],
		dodecahedron: [[0, 1, 3, 6, 9]],
		icosahedron: [[20, 21, 22]],
		rhombicTriacontahedron: [[20, 6, 21, 9]]
});

import { Matrix3, Vector3 } from 'three';
import { Group, GroupElement, Polyhedron } from './Group';

// rotation by 2pi/3 about (1,1,1)
export const a = new GroupElement(new Matrix3().set(
		0, 1, 0,
		0, 0, 1,
		1, 0, 0
), 'a');
// rotation by pi/2 about (1,0,0)
export const b = new GroupElement(new Matrix3().set(
		1, 0, 0,
		0, 0, -1,
		0, 1, 0
), 'b');

export const group = new Group([a, b]);

export const compound = new Polyhedron(group, [
		new Vector3(2, 0, 0),
		new Vector3(1, 1, 1),
		new Vector3(1, 1, 0),
], {
		octahedron: [[0, 2, 1]],
		cube: [[6, 8, 11, 7]],
		cuboctahedron: [
				[14, 16, 15],
				[14, 15, 17, 20],
		],
		rhombicDodecahedron: [[0, 6, 1, 7]],
});

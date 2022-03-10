import { Matrix3, Vector3 } from 'three';
import { Group, GroupElement, Polyhedron } from './Group';

// rotation by 2pi/3 about (1,1,1)
export const a = new GroupElement(new Matrix3().set(
		0, 1, 0,
		0, 0, 1,
		1, 0, 0
), 'a');
// rotation by pi about (0,0,1)
export const b = new GroupElement(new Matrix3().set(
		-1, 0, 0,
		0, -1, 0,
		0,  0, 1
), 'b');

export const group = new Group([a, b]);
export const tetrahedron = new Polyhedron(group, [new Vector3(1, 1, 1)], { tetrahedron: [[0, 1, 2]] });

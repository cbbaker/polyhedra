import {
		Face3,
		Geometry,
		Mesh,
		MeshPhongMaterial,
		Quaternion,
		Vector3,
} from 'three';
import { Stream } from 'xstream';
import { ControlState as Controls } from './schema';
import { computeOperations } from './permutations';

import MeshProducer from './MeshProducer';

type ControlState = {
		orientation: Stream<Quaternion>;
		coreOpacity: Stream<number>;
		coreHue: Stream<number>;
		cubeOpacity: Stream<number>;
		cubeHue: Stream<number>;
		octahedronOpacity: Stream<number>;
		octahedronHue: Stream<number>;
		caseOpacity: Stream<number>;
		caseHue: Stream<number>;
};

const schema = [{
				type: 'quaternion',
				id: 'orientation',
				title: 'Orientation',
				initial: new Quaternion(0, 0, 0, 1),
		}, {
				type: 'range',
				id: 'coreOpacity',
				title: 'Core Opacity',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}, {
				type: 'range',
				id: 'coreHue',
				title: 'Core Hue',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 0.5,
		}, {
				type: 'range',
				id: 'cubeOpacity',
				title: 'Cube Opacity',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}, {
				type: 'range',
				id: 'cubeHue',
				title: 'Cube Hue',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 0.5,
		}, {
				type: 'range',
				id: 'octahedronOpacity',
				title: 'Octahedron Opacity',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}, {
				type: 'range',
				id: 'octahedronHue',
				title: 'Octahedron Hue',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 0.5,
		}, {
				type: 'range',
				id: 'caseOpacity',
				title: 'Case Opacity',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}, {
				type: 'range',
				id: 'caseHue',
				title: 'Case Hue',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}];

function isControlState(props: Record<string, Stream<unknown>>): props is ControlState {
		return schema.every(item => {
				const prop = props[item.id];
				if (prop === undefined) {
						return false;
				}
				return true;
		});
}

const id = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
// rotate 90 deg around (0, 0, 1)
// (0 2 1 3)(4 5 6 7)(8 10 9 11)(12 14 13 15)(16)(17)(18 25 19 24)(20 22 21 23)
const a1 = [2, 3, 1, 0, 5, 6, 7, 4, 10, 11, 9, 8, 14, 15, 13, 12, 16, 17, 25, 24, 22, 23, 21, 20, 18, 19];
// rotate 120 deg around (1, 1, 1)
// (0 4 2)(1 7 10)(3 8 5)(6 11 9)(12 14 16)(13 15 17)(18)(19 21 20)(22)(23 25 24)
const b1 = [4, 7, 0, 8, 2, 3, 11, 10, 5, 6, 1, 9, 14, 15, 16, 17, 12, 13, 18, 21, 19, 20, 22, 25, 23, 24];

const operations = computeOperations(a1, b1, id, []);

class Cuboctahedron extends MeshProducer {
		controls: ControlState;
		materials: MeshPhongMaterial[];

		constructor(controls: Controls) {
				super();
				
				if (!isControlState(controls)) {
						throw new Error('Stella Octangula: invalid controls');
				}

				this.controls = controls;
				this.geometry = new Geometry();
				this.createMaterials();
				this.createMesh();
		}

		createMaterials() {
				this.materials = [
						new MeshPhongMaterial({ color: 0, transparent: true }), // core
						new MeshPhongMaterial({ color: 0, transparent: true }), // cube
						new MeshPhongMaterial({ color: 0, transparent: true }), // octahedron
						new MeshPhongMaterial({ color: 0, transparent: true }), // case
				];

				const saturation = 0.5;
				const value = 0.5;

				this.addSubscription(this.controls.coreOpacity.subscribe({
						next: (opacity: number) => {
								this.materials[0].opacity = opacity;
								this.materials[0].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.coreHue.subscribe({
						next: (hue: number) => {
								this.materials[0].color.setHSL(hue, saturation, value);
								this.materials[0].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.cubeOpacity.subscribe({
						next: (opacity: number) => {
								this.materials[1].opacity = opacity;
								this.materials[1].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.cubeHue.subscribe({
						next: (hue: number) => {
								this.materials[1].color.setHSL(hue, saturation, value);
								this.materials[1].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.octahedronOpacity.subscribe({
						next: (opacity: number) => {
								this.materials[2].opacity = opacity;
								this.materials[2].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.octahedronHue.subscribe({
						next: (hue: number) => {
								this.materials[2].color.setHSL(hue, saturation, value);
								this.materials[2].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.caseOpacity.subscribe({
						next: (opacity: number) => {
								this.materials[3].opacity = opacity;
								this.materials[3].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.caseHue.subscribe({
						next: (hue: number) => {
								this.materials[3].color.setHSL(hue, saturation, value);
								this.materials[3].needsUpdate = true;
						},
				}));
		}

		addFace(indices: number[], materialIndex: number) {
        for (let i = 2; i < indices.length; ++i) {
            const face = new Face3(indices[0], indices[i - 1], indices[i]);
            face.materialIndex = materialIndex;
            this.geometry.faces.push(face);
        }
		}

		createMesh() {
				this.geometry.vertices.push(
						new Vector3( 1,  0,  1), // 0
						new Vector3(-1,  0,  1), // 1
						new Vector3( 0,  1,  1), // 2
						new Vector3( 0, -1,  1), // 3

						new Vector3( 1,  1,  0), // 4
						new Vector3(-1,  1,  0), // 5
						new Vector3(-1, -1,  0), // 6
						new Vector3( 1, -1,  0), // 7

						new Vector3( 1,  0, -1), // 8
						new Vector3(-1,  0, -1), // 9
						new Vector3( 0,  1, -1), // 10
						new Vector3( 0, -1, -1), // 11

						new Vector3( 2,  0,  0), // 12
						new Vector3(-2,  0,  0), // 13
						new Vector3( 0,  2,  0), // 14
						new Vector3( 0, -2,  0), // 15
						new Vector3( 0,  0,  2), // 16
						new Vector3( 0,  0, -2), // 17

						new Vector3( 1,  1,  1), // 18
						new Vector3(-1, -1,  1), // 19
						new Vector3(-1,  1, -1), // 20
						new Vector3( 1, -1, -1), // 21
						new Vector3(-1, -1, -1), // 22
						new Vector3( 1,  1, -1), // 23
						new Vector3( 1, -1,  1), // 24
						new Vector3(-1,  1,  1), // 25
				);

        this.mesh = new Mesh(this.geometry, this.materials);

        this.addSubscription(this.controls.orientation.subscribe({
            next: (orientation: Quaternion) => {
                this.mesh.quaternion.copy(orientation);
            }
        }));

				// core
				this.addFace([0,2,1,3], 0);
				this.addFace([0,7,8,4], 0);
				this.addFace([2,4,10,5], 0);
				this.addFace([1,5,9,6], 0);
				this.addFace([3,6,11,7], 0);
				this.addFace([8,11,9,10], 0);

				this.addFace([0,4,2], 0);
				this.addFace([1,2,5], 0);
				this.addFace([1,6,3], 0);
				this.addFace([0,3,7], 0);
				this.addFace([4,8,10], 0);
				this.addFace([5,10,9], 0);
				this.addFace([6,9,11], 0);
				this.addFace([7,11,8], 0);

				// cube
				this.addFace([18,25,19,24], 1);
				this.addFace([18,24,21,23], 1);
				this.addFace([18,23,20,25], 1);
				this.addFace([19,25,20,22], 1);
				this.addFace([19,22,21,24], 1);
				this.addFace([20,23,21,22], 1);

				// octahedron
				this.addFace([12,14,16], 2);
				this.addFace([13,16,14], 2);
				this.addFace([13,15,16], 2);
				this.addFace([12,16,15], 2);
				this.addFace([12,17,14], 2);
				this.addFace([13,14,17], 2);
				this.addFace([13,17,15], 2);
				this.addFace([12,15,17], 2);

				// case
				this.addFace([12,23,14,18], 3);
				this.addFace([13,25,14,20], 3);
				this.addFace([13,22,15,19], 3);
				this.addFace([12,24,15,21], 3);
				this.addFace([14,23,17,20], 3);
				this.addFace([13,20,17,22], 3);
				this.addFace([15,22,17,21], 3);
				this.addFace([12,21,17,23], 3);
				this.addFace([14,25,16,18], 3);
				this.addFace([13,19,16,25], 3);
				this.addFace([15,24,16,19], 3);
				this.addFace([12,18,16,24], 3);

        this.geometry.computeBoundingSphere();
        this.geometry.computeFaceNormals();
        this.geometry.elementsNeedUpdate = true;
		}
};

const config = {
		id: 'cuboctahedron',
		title: 'Cuboctahedron',
		schema,
		ctor: Cuboctahedron,
};

export default config;


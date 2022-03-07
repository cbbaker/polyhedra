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
import { Pose } from '../Pose';
import MeshProducer from './MeshProducer';

type ControlState = {
		pose: Stream<Pose>;
		coreOpacity: Stream<number>;
		coreHue: Stream<number>;
		figureOpacity: Stream<number>;
		evenHue: Stream<number>;
		oddHue: Stream<number>;
		caseOpacity: Stream<number>;
		caseHue: Stream<number>;
};

const schema = [
		{
				type: 'pose',
				id: 'pose',
				title: 'Orientation',
				initial: {
						orientation: new Quaternion(0, 0, 0, 1),
						scale: 1,
				},
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
				id: 'figureOpacity',
				title: 'Figure Opacity',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}, {
				type: 'range',
				id: 'evenHue',
				title: 'Even Hue',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
		}, {
				type: 'range',
				id: 'oddHue',
				title: 'Odd Hue',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 1,
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

class StellaOctangula extends MeshProducer {
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
						new MeshPhongMaterial({ color: 0, transparent: true }), // even
						new MeshPhongMaterial({ color: 0, transparent: true }), // odd
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

				this.addSubscription(this.controls.figureOpacity.subscribe({
						next: (opacity: number) => {
								this.materials[1].opacity = opacity;
								this.materials[1].needsUpdate = true;
								this.materials[2].opacity = opacity;
								this.materials[2].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.evenHue.subscribe({
						next: (hue: number) => {
								this.materials[1].color.setHSL(hue, saturation, value);
								this.materials[1].needsUpdate = true;
						},
				}));

				this.addSubscription(this.controls.oddHue.subscribe({
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
						new Vector3( 1,  0,  0), //  0
						new Vector3(-1,  0,  0), //  1
						new Vector3( 0,  1,  0), //  2
						new Vector3( 0, -1,  0), //  3
						new Vector3( 0,  0,  1), //  4
						new Vector3( 0,  0, -1), //  5

						new Vector3( 1,  1,  1), //  6
						new Vector3(-1, -1,  1), //  7
						new Vector3(-1,  1, -1), //  8
						new Vector3( 1, -1, -1), //  9

						new Vector3(-1, -1, -1), // 10
						new Vector3( 1,  1, -1), // 11
						new Vector3( 1, -1,  1), // 12
						new Vector3(-1,  1,  1), // 13
				);

        this.mesh = new Mesh(this.geometry, this.materials);

				this.addSubscription(this.controls.pose.subscribe({
						next: ({ orientation, scale }: Pose) => {
								this.mesh.quaternion.copy(orientation);
								this.mesh.scale.setScalar(scale);
						}
				}));

				// core
				this.addFace([0, 2, 4], 0);
				this.addFace([2, 1, 4], 0);
				this.addFace([1, 3, 4], 0);
				this.addFace([3, 0, 4], 0);
				this.addFace([1, 3, 5], 0);
				this.addFace([0, 3, 5], 0);
				this.addFace([2, 0, 5], 0);
				this.addFace([1, 2, 5], 0);

				// even
				this.addFace([6, 9, 8], 1);
				this.addFace([6, 8, 7], 1);
				this.addFace([6, 7, 9], 1);
				this.addFace([9, 7, 8], 1);

				// odd
				this.addFace([13, 10, 12], 2);
				this.addFace([12, 10, 11], 2);
				this.addFace([11, 10, 13], 2);
				this.addFace([11, 13, 12], 2);

				// case
				this.addFace([ 6, 13,  7, 12], 3); // z = 1
				this.addFace([10,  8, 11,  9], 3); // z = -1
				this.addFace([ 6, 11,  8, 13], 3); // y = 1
				this.addFace([12,  7, 10,  9], 3); // y = -1
				this.addFace([ 6, 12,  9, 11], 3); // x = 1
				this.addFace([13,  8, 10,  7], 3); // x = -1


        this.geometry.computeBoundingSphere();
        this.geometry.computeFaceNormals();
        this.geometry.elementsNeedUpdate = true;
		}
};

const config = {
		id: 'stellaOctangula',
		title: 'Stella Octangula',
		schema,
		ctor: StellaOctangula,
};

export default config;


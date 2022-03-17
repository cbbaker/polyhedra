import {
		Face3,
		Geometry,
		Mesh,
		MeshPhongMaterial,
		Quaternion,
} from 'three';
import { Stream } from 'xstream';
import { ControlState as Controls } from './schema';
import { Pose } from '../Pose';
import { compound } from './groups/octahedral';
import MeshProducer from './MeshProducer';
import { Polyhedron } from './groups/Group';

type ControlState = {
		pose: Stream<Pose>;
		coreOpacity: Stream<number>;
		coreHue: Stream<number>;
		cubeOpacity: Stream<number>;
		cubeHue: Stream<number>;
		octahedronOpacity: Stream<number>;
		octahedronHue: Stream<number>;
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

class Cuboctahedron extends MeshProducer {
		polyhedron: Polyhedron;
		controls: ControlState;
		materials: MeshPhongMaterial[];

		constructor(controls: Controls) {
				super();

				this.polyhedron = compound;
				
				if (!isControlState(controls)) {
						throw new Error('Stella Octangula: invalid controls');
				}

				this.controls = controls;
				this.geometry = new Geometry();
				this.createMaterials();
				this.createMesh();
		}

		createMaterials() {
				const blackParams = { color: 0, transparent: true };
				this.materials = [
						new MeshPhongMaterial({ ...blackParams, polygonOffset: true, polygonOffsetUnits: -10}), // core
						new MeshPhongMaterial(blackParams), // dodecahedron
						new MeshPhongMaterial(blackParams), // icosahedron
						new MeshPhongMaterial(blackParams), // case
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
				this.polyhedron.vertices.forEach(v => this.geometry.vertices.push(v));

				this.mesh = new Mesh(this.geometry, this.materials);

				this.addSubscription(this.controls.pose.subscribe({
						next: ({ orientation, scale }: Pose) => {
								this.mesh.quaternion.copy(orientation);
								this.mesh.scale.setScalar(scale);
						}
				}));

				this.polyhedron.faces.cuboctahedron.forEach(faces => faces.forEach(face => this.addFace(face, 0)));
				this.polyhedron.faces.cube.forEach(faces => faces.forEach(face => this.addFace(face, 1)));
				this.polyhedron.faces.octahedron.forEach(faces => faces.forEach(face => this.addFace(face, 2)));
				this.polyhedron.faces.rhombicDodecahedron.forEach(faces => faces.forEach(face => this.addFace(face, 3)));
				

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


import { Stream } from 'xstream';
import * as three from 'three';
import { ControlState as Controls } from './schema';
import { Pose } from '../Pose';
import { Permutation, isPermutationOf, computeOperations } from './permutations';
import MeshProducer from './MeshProducer';

type ControlState = {
    pose: Stream<Pose>;
    opacity: Stream<number>;
    showShell: Stream<boolean>;
    showSkeleton: Stream<boolean>;
    cubeCount: Stream<number>;
    evenTetrahedraCount: Stream<number>;
    oddTetrahedraCount: Stream<number>;
}

const schema = [
		{
				type: 'pose',
				id: 'pose',
				title: 'Orientation',
				initial: {
						orientation: new three.Quaternion(0, 0, 0, 1),
						scale: 1,
				}
		},
		{
				type: 'boolean',
				id: 'showShell',
				title: 'Show shell',
				initial: true,
		},
		{
				type: 'boolean',
				id: 'showSkeleton',
				title: 'Show skeleton',
				initial: false,
		},
		{
				type: 'range',
				id: 'opacity',
				title: 'Opacity',
				min: 0,
				max: 1,
				step: 0.05,
				initial: 0.5,
		},
		{
				type: 'range',
				id: 'cubeCount',
				title: 'Cube count',
				min: 0,
				max: 5,
				step: 1,
				initial: 0,
		},
		{
				type: 'range',
				id: 'evenTetrahedraCount',
				title: 'Even Tetrahedra count',
				min: 0,
				max: 5,
				step: 1,
				initial: 0,
		},
		{
				type: 'range',
				id: 'oddTetrahedraCount',
				title: 'Odd Tetrahedra count',
				min: 0,
				max: 5,
				step: 1,
				initial: 0,
		},
];

function isControlState(props: Record<string, Stream<unknown>>): props is ControlState {
		return schema.every(item => {
				const prop = props[item.id];
				if (prop === undefined) {
						return false;
				}
				return true;
		});
}

const id = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const a1 = [8, 5, 16, 13, 14, 19, 2, 11, 4, 18, 17, 3, 0, 15, 12, 7, 9, 1, 6, 10] // (0 8 4 14 12)(16 9 18 6 2)(7 11 3 13 15)(19 10 17 1 5)
const b1 = [9, 18, 13, 7, 0, 14, 17, 10, 8, 4, 3, 11, 1, 19, 16, 6, 5, 15, 12, 2] //  (0 9 4)(12 1 18)(16 5 14)(7 10 3)(15 6 17)(19 2 13)

const operations = computeOperations(a1, b1, id, []);

function computeCubeOperations(operations: Permutation[]): Permutation[] {
		const found = [] as Permutation[];

		operations.forEach(op => {
				if (!found.find(p => isPermutationOf(op.slice(0, 8), p.slice(0, 8)))) {
						found.push(op);
				}
		});

		return found;
}

const cubeOperations = computeCubeOperations(operations);

class Dodecahedron extends MeshProducer {
		controls: ControlState;
		materials: Map<string, three.Material>;
		colors: string[];

		constructor(controls: Controls) {
				super();

				if (!isControlState(controls)) {
						throw new Error('Dodecahedron: invalid controls');
				}

				this.controls = controls;
				this.createMaterials();
				this.computeMesh();
		}

		addFaces(indices: number[], materialIndex: number): void {
				for (let i = 2; i < indices.length; ++i) {
						const face = new three.Face3(indices[0], indices[i - 1], indices[i]);
						face.materialIndex = materialIndex;
						this.geometry.faces.push(face);
				}
		}

		createMaterials() {
				this.materials = new Map<string, three.Material>();
				this.materials.set('white', new three.MeshPhongMaterial({
						color: 0xffffff,
				}));
				this.materials.set('red', new three.MeshPhongMaterial({
						color: 0xff0000,
				}));
				this.materials.set('green', new three.MeshPhongMaterial({
						color: 0x00ff00,
				}));
				this.materials.set('blue', new three.MeshPhongMaterial({
						color: 0x0000ff,
				}));
				this.materials.set('yellow', new three.MeshPhongMaterial({
						color: 0xffff00,
				}));
				this.materials.set('magenta', new three.MeshPhongMaterial({
				}));

				this.colors = Array.from(this.materials.keys());
		}

		updateMaterials(opacity: number) {
				this.materials.forEach(material => {
						material.transparent = opacity < 1;
						material.opacity = opacity;
						material.needsUpdate = true;
				});
		}

		getMaterial(color: string): number {
				return this.colors.indexOf(color);
		}

		addCubeFaces(indices: Permutation, materialIndex: number): void {
				this.addFaces([indices[0], indices[2], indices[3], indices[1]], materialIndex); //+x
				this.addFaces([indices[4], indices[5], indices[7], indices[6]], materialIndex); //-x

				this.addFaces([indices[0], indices[1], indices[5], indices[4]], materialIndex); //+y
				this.addFaces([indices[2], indices[6], indices[7], indices[3]], materialIndex); //-y

				this.addFaces([indices[0], indices[4], indices[6], indices[2]], materialIndex); //+z
				this.addFaces([indices[1], indices[3], indices[7], indices[5]], materialIndex); //-z
		}

		addEvenTetrahedraFaces(indices: Permutation, materialIndex: number): void {
				this.addFaces([indices[0], indices[3], indices[5]], materialIndex);
				this.addFaces([indices[0], indices[6], indices[3]], materialIndex);
				this.addFaces([indices[0], indices[5], indices[6]], materialIndex);
				this.addFaces([indices[3], indices[6], indices[5]], materialIndex);
		}

		addOddTetrahedraFaces(indices: Permutation, materialIndex: number): void {
				this.addFaces([indices[1], indices[4], indices[2]], materialIndex);
				this.addFaces([indices[1], indices[2], indices[7]], materialIndex);
				this.addFaces([indices[1], indices[7], indices[4]], materialIndex);
				this.addFaces([indices[2], indices[4], indices[7]], materialIndex);
		}

		computeMesh() {
				this.geometry = new three.Geometry();
				const phi = 0.5 * (1 + Math.sqrt(5));
				const invPhi = 1.0 / phi;

				this.geometry.vertices.push(
						new three.Vector3(1, 1, 1),        //  0
						new three.Vector3(1, 1, -1),        //  1
						new three.Vector3(1, -1, 1),        //  2
						new three.Vector3(1, -1, -1),        //  3

						new three.Vector3(-1, 1, 1),        //  4
						new three.Vector3(-1, 1, -1),        //  5
						new three.Vector3(-1, -1, 1),        //  6
						new three.Vector3(-1, -1, -1),        //  7

						new three.Vector3(0, phi, invPhi),  //  8
						new three.Vector3(0, phi, -invPhi),  //  9
						new three.Vector3(0, -phi, invPhi),  // 10
						new three.Vector3(0, -phi, -invPhi),  // 11

						new three.Vector3(invPhi, 0, phi),  // 12
						new three.Vector3(invPhi, 0, -phi),  // 13
						new three.Vector3(-invPhi, 0, phi),  // 14
						new three.Vector3(-invPhi, 0, -phi),  // 15

						new three.Vector3(phi, invPhi, 0),  // 16
						new three.Vector3(phi, -invPhi, 0),  // 17
						new three.Vector3(-phi, invPhi, 0),  // 18
						new three.Vector3(-phi, -invPhi, 0),  // 19
				);

				this.mesh = new three.Mesh(this.geometry, this.colors.map(color => {
						const material = this.materials.get(color);
						material.needsUpdate = true;
						return material
				}));

				this.addSubscription(this.controls.pose.subscribe({
						next: ({ orientation, scale }: Pose) => {
								this.mesh.quaternion.copy(orientation);
								this.mesh.scale.setScalar(scale);
						}
				}));

				const controls$ = Stream.combine(
						this.controls.opacity,
						this.controls.showShell,
						this.controls.showSkeleton,
						this.controls.cubeCount,
						this.controls.evenTetrahedraCount,
						this.controls.oddTetrahedraCount,
				);

				this.subscriptions.push(controls$.subscribe({
						next: ([opacity, showShell, showSkeleton, cubeCount, evenTetrahedraCount, oddTetrahedraCount]) => {
								this.geometry.faces = [];

								this.updateMaterials(opacity);
								if (showSkeleton) {
										//cube
										this.addCubeFaces([0, 1, 2, 3, 4, 5, 6, 7], this.getMaterial('red'));

										// rectangles
										this.addFaces([8, 9, 11, 10], this.getMaterial('blue'));
										this.addFaces([8, 10, 11, 9], this.getMaterial('blue'));

										this.addFaces([12, 13, 15, 14], this.getMaterial('green'));
										this.addFaces([12, 14, 15, 13], this.getMaterial('green'));

										this.addFaces([16, 17, 19, 18], this.getMaterial('yellow'));
										this.addFaces([16, 18, 19, 17], this.getMaterial('yellow'));
								}

								for (let i = 0; i < cubeCount; ++i) {
										this.addCubeFaces(cubeOperations[i], i + 1);
								}

								for (let i = 0; i < evenTetrahedraCount; ++i) {
										this.addEvenTetrahedraFaces(cubeOperations[i], i + 1);
								}

								for (let i = 0; i < oddTetrahedraCount; ++i) {
										this.addOddTetrahedraFaces(cubeOperations[i], i + 1);
								}

								if (showShell) {
										// dodecahedron
										this.addFaces([0, 12, 2, 17, 16], this.getMaterial('white'));
										this.addFaces([0, 8, 4, 14, 12], this.getMaterial('white'));
										this.addFaces([4, 18, 19, 6, 14], this.getMaterial('white'));
										this.addFaces([2, 12, 14, 6, 10], this.getMaterial('white'));

										this.addFaces([2, 10, 11, 3, 17], this.getMaterial('white'));
										this.addFaces([0, 16, 1, 9, 8], this.getMaterial('white'));
										this.addFaces([4, 8, 9, 5, 18], this.getMaterial('white'));
										this.addFaces([6, 19, 7, 11, 10], this.getMaterial('white'));

										this.addFaces([1, 16, 17, 3, 13], this.getMaterial('white'));
										this.addFaces([1, 13, 15, 5, 9], this.getMaterial('white'));
										this.addFaces([5, 15, 7, 19, 18], this.getMaterial('white'));
										this.addFaces([3, 11, 7, 15, 13], this.getMaterial('white'));
								}

								this.geometry.computeBoundingSphere();
								this.geometry.computeFaceNormals();
								this.geometry.elementsNeedUpdate = true;

						}
				}));
		}
};

const config = {
		id: 'dodecahedron',
		title: 'Dodecahedron',
		schema,
		ctor: Dodecahedron,
};

export default config;

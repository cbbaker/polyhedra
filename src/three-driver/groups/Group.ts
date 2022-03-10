import { Matrix3, Vector3 } from 'three';

const id = new Matrix3().fromArray([
		1, 0, 0,
		0, 1, 0,
		0, 0, 1
]);

function matricesEqual(lhs: Matrix3, rhs: Matrix3): boolean {
		const epsilon = (l: number, r: number) => Math.abs(l - r) < 0.01;
		return lhs.elements.every((l, index) => epsilon(l, rhs.elements[index]));
}

function vectorsEqual(lhs: Vector3, rhs: Vector3): boolean {
		const epsilon = (l: number, r: number) => Math.abs(l - r) < 0.01;
		return epsilon(lhs.x, rhs.x) && epsilon(lhs.y, rhs.y) && epsilon(lhs.z, rhs.z);
}

export class GroupElement {
		matrix: Matrix3;
		label: string;

		constructor(matrix: Matrix3, label: string) {
				this.matrix = matrix;
				this.label = label;
		}

		composeWith(other: GroupElement): GroupElement {
				const newMatrix = this.matrix.clone().multiply(other.matrix);
				const newLabel = this.label + other.label;
				return new GroupElement(newMatrix, newLabel);
		}

		equal(other: GroupElement): boolean {
				return matricesEqual(this.matrix, other.matrix);
		}

		transform(vertex: Vector3): Vector3 {
				return vertex.clone().applyMatrix3(this.matrix);
		}
}

export class Group {
		generators: GroupElement[];
		relations: [string, string][];
		elements: GroupElement[];

		constructor(generators: GroupElement[]) {
				this.generators = generators;
				this.computeElements();
		}

		findIndex(element: GroupElement): number {
				return this.elements.findIndex(g => element.equal(g));
		}

		computeElements() {
				this.elements = [];
				this.relations = [];

				for (const queue = [ new GroupElement(id, '') ]; queue.length > 0; ) {
						const top = queue.shift();
						if (top.label.length > 20) {
								console.log('elements found', this.elements.length);
								throw new Error('group too big')
						}
						const found = this.findIndex(top);
						if (found >= 0) {
								this.relations.push([top.label, this.elements[found].label]);
								continue;
						}

						this.elements.push(top);

						this.generators.forEach((generator: GroupElement) => {
								queue.push(top.composeWith(generator));
						})
				}
		}

		transform(vertex: Vector3): Vector3[] {
				return this.elements.map((element: GroupElement) => element.transform(vertex));
		}
}

export class Face {
		vertices: number[];

		constructor(vertices: number[]) {
				const [first, ...rest] = vertices;
				const { minIndex } = rest.reduce(({ min, minIndex }, cur: number, index: number) => {
						if (cur < min) {
								return { min: cur, minIndex: index + 1 };
						}
						return { min, minIndex };
				}, { min: first, minIndex: 0 });

				if (minIndex === 0) {
						this.vertices = vertices;
				} else {
						this.vertices = vertices.slice(minIndex).concat(vertices.slice(0, minIndex));
				}
		}

		equals(other: Face) {
				if (this.vertices.length != other.vertices.length) {
						return false;
				}

				return this.vertices.every((vertex: number, index: number) => vertex === other.vertices[index]);
		}

		getOffset(vertexOffset: number): number[] {
				return this.vertices.map(i => i + vertexOffset);
		}

		permute(p: number[]): Face {
				const vertices = this.vertices.map((vertex: number) => p[vertex]);
				return new Face(vertices);
		}
}

export class VertexGSet {
		vertices: Vector3[];
		group: Group;
		action: number[][];

		constructor(group: Group) {
				this.vertices = [];
				this.group = group;
		}

		addOrbit(generator: Vector3) {
				this.group.transform(generator).forEach((vertex: Vector3) => {
						if (this.findIndex(vertex) < 0) {
								this.vertices.push(vertex);
						}
				});
				
				this.computeAction();
		}

		findIndex(vertex: Vector3): number {
				return this.vertices.findIndex((other: Vector3) => vectorsEqual(vertex, other));
		}

		computeAction() {
				this.action = this.group.elements.map((element: GroupElement) => {
						return this.vertices.map((vertex: Vector3) => this.findIndex(element.transform(vertex)));
				});
		}

		transformFace(face: Face): Face[] {
				return this.action.reduce((faces: Face[], permutation: number[]): Face[] => {
						const permuted = face.permute(permutation);
						if (faces.findIndex(f => permuted.equals(f)) < 0) {
								faces.push(permuted)
						}
						return faces;
				}, []);
		}
}

export class Polyhedron {
		vertices: Vector3[];
		faces: Record<string, number[][][]>;

		constructor(group: Group, generators: Vector3[], faceIndicesMap: Record<string, number[][]>) {
				const gSet = new VertexGSet(group);
				generators.forEach(v => gSet.addOrbit(v));
				this.vertices = gSet.vertices;
				
				this.faces = {};
				Object.entries(faceIndicesMap).forEach(([key, faceIndicesList]) => {
						const generators = faceIndicesList.map(fil => new Face(fil));
						const facesList = generators.map(generator => gSet.transformFace(generator));
						this.faces[key] = facesList.map(fl => fl.map(f => f.vertices));
				});
		}
}

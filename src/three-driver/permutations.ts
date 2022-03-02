export type Permutation = number[];

export function permutationsEqual(p1: Permutation, p2: Permutation): boolean {
    if (p1.length !== p2.length) {
        return false;
    }

    for (let i = 0; i < p1.length; ++i) {
        if (p1[i] !== p2[i]) {
            return false;
        }
    }

    return true;
}

export function isPermutationOf(p1: Permutation, p2: Permutation): boolean {
    if (p1.length !== p2.length) {
        return false;
    }

    return p1.every(i => p2.indexOf(i) >= 0);
}

export function compose(p1: Permutation, ...ps: Permutation[]) {
    const compose2 = (p1: Permutation, p2: Permutation): Permutation => p1.map((i: number) => p2[i]);
    return ps.reduce((acc, p) => compose2(acc, p), p1);
}

export function computeOperations(a1: Permutation, b1: Permutation, p: Permutation, operations: Permutation[]): Permutation[] {
    if (operations.find((op: Permutation) => permutationsEqual(p, op))) {
        return operations;
    }

    operations.push(p);

    const leftOperations = computeOperations(a1, b1, compose(p, a1), operations);
    return computeOperations(a1, b1, compose(p, b1), leftOperations);
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

		permute(p: Permutation): Face {
				const vertices = this.vertices.map((vertex: number) => p[vertex]);
				return new Face(vertices);
		}

		print(color: number) {
				console.log(`this.addFace([${this.vertices}], ${color});`);
		}
}

export function makeFaces(face: Face, ps: Permutation[]): Face[] {
		const faces: Face[] = [];

		const addNew = (newFace: Face) => {
				if (!faces.find(face => face.equals(newFace))) {
						faces.push(newFace);
				}
		}

		ps.forEach((p: Permutation) => addNew(face.permute(p)));

		return faces;
}


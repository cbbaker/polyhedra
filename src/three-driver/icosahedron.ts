import { Stream, Subscription, Listener } from 'xstream';
import * as three from 'three';
import { ControlState as Controls } from './schema';
import { Pose } from '../Pose';
import MeshProducer from './MeshProducer';

type ControlState = {
		pose: Stream<Pose>;
    interpolate: Stream<number>;
}

export const schema = [
		{
				type: 'pose',
				id: 'pose',
				title: 'Orientation',
				initial: {
						orientation: new three.Quaternion(0, 0, 0, 1),
						scale: 1,
				},
		},
    {
        type: 'range',
        id: 'interpolate',
        title: 'Amount',
        min: 0.5,
        max: 1,
        step: 0.01,
        initial: 0.62,
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

class Icosahedron extends MeshProducer {
    controls: ControlState;

    constructor(controls: Controls) {
				super();

				if (!isControlState(controls)) {
						throw new Error('Icosahedron: invalid controls');
				}
        this.controls = controls;
        this.computeMesh();
    }

    setFaceColor(start: number): void {
        const color = new three.Color().setHSL(Math.random(), 0.3, 0.5);
        this.geometry.faces[start].color = color;
    }

    addFace(indices: [number, number, number]): void {
        const [i1, i2, i3] = indices;

        const start = this.geometry.faces.length;

        this.geometry.faces.push(new three.Face3(i1, i2, i3));

        this.setFaceColor(start)
    }

    computeVertices(interpolate: number) {
        this.geometry.vertices = [];
        const scale = 3.0
        const a = interpolate * scale, b = (1 - interpolate) * scale;
        // x -> y
        this.geometry.vertices.push(new three.Vector3(b, a, 0)); //  0
        this.geometry.vertices.push(new three.Vector3(b, -a, 0)); //  1 
        this.geometry.vertices.push(new three.Vector3(-b, a, 0)); //  2
        this.geometry.vertices.push(new three.Vector3(-b, -a, 0)); //  3
        // y -> z
        this.geometry.vertices.push(new three.Vector3(0, b, a)); //  4
        this.geometry.vertices.push(new three.Vector3(0, b, -a)); //  5
        this.geometry.vertices.push(new three.Vector3(0, -b, a)); //  6
        this.geometry.vertices.push(new three.Vector3(0, -b, -a)); //  7
        // z -> x
        this.geometry.vertices.push(new three.Vector3(a, 0, b)); //  8
        this.geometry.vertices.push(new three.Vector3(-a, 0, b)); //  9
        this.geometry.vertices.push(new three.Vector3(a, 0, -b)); // 10
        this.geometry.vertices.push(new three.Vector3(-a, 0, -b)); // 11
    }

    computeMesh() {
        this.geometry = new three.Geometry();

        const phi = 0.5 * (1 + Math.sqrt(5));
        const invPhi = 1.0 / phi;

        this.computeVertices(invPhi);

        // equilaterals
        this.addFace([0, 4, 8]); // +x, +y, +z
        this.addFace([0, 10, 5]); // +x, +y, -z
        this.addFace([1, 8, 6]); // +x, -y, +z
        this.addFace([1, 7, 10]); // +x, -y, -z

        this.addFace([2, 9, 4]) // -x, +y, +z
        this.addFace([2, 5, 11]) // -x, +y, -z
        this.addFace([3, 6, 9]) // -x, -y, +z
        this.addFace([3, 11, 7]) // -x, -y, -z

        // isoceleses
        // z-plane
        this.addFace([0, 8, 10])
        this.addFace([1, 10, 8])
        this.addFace([2, 11, 9])
        this.addFace([3, 9, 11])
        // x-plane
        this.addFace([4, 0, 2])
        this.addFace([5, 2, 0])
        this.addFace([6, 3, 1])
        this.addFace([7, 1, 3])
        // y-plane
        this.addFace([8, 4, 6])
        this.addFace([9, 6, 4])
        this.addFace([10, 7, 5])
        this.addFace([11, 5, 7])

        this.subscriptions.push(this.controls.interpolate.subscribe({
            next: (interpolate) => {
                this.computeVertices(interpolate);
                this.geometry.computeBoundingSphere();
                this.geometry.computeFaceNormals();
                this.geometry.elementsNeedUpdate = true;
            }
        }));

        const material = new three.MeshPhongMaterial({
            vertexColors: true,
        });

        this.mesh = new three.Mesh(this.geometry, material);

				this.addSubscription(this.controls.pose.subscribe({
						next: ({ orientation, scale }: Pose) => {
								this.mesh.quaternion.copy(orientation);
								this.mesh.scale.setScalar(scale);
						}
				}));
    }
};

const config = {
		id: 'icosahedron',
		title: 'Icosahedron',
		schema,
		ctor: Icosahedron,
};

export default config;

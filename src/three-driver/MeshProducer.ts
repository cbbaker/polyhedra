import { Subscription, Listener } from 'xstream';
import { Object3D, Geometry, Scene } from 'three';

export default class MeshProducer {
		mesh: Object3D;
		geometry: Geometry;
		scene: Scene;
		subscriptions: Subscription[];

		constructor() {
				this.subscriptions = [];
		}

		addSubscription(subscription: Subscription) {
				this.subscriptions.push(subscription);
		}

		addMesh(scene: Scene): Object3D {
				this.scene = scene;
				scene.add(this.mesh);
				return this.mesh;
		}

		start(listener: Listener<(scene: Scene) => Object3D>) {
				listener.next((scene: Scene): Object3D => this.addMesh(scene));
		}

		stop() {
				if (this.scene) {
						this.scene.remove(this.mesh);
				}
				this.subscriptions.forEach(subscription => subscription.unsubscribe());
		}
};

import { Quaternion, Vector3 } from 'three';
import { Stream } from 'xstream';
import { TimeSource } from '@cycle/time';
import { Pose, PoseUpdater } from './Pose'


export default function simpleRotation(time: TimeSource, angVel: Vector3): Stream<Pose> {
		const scale = angVel.length();
		if (scale > 0.00001) {
				const axis = angVel.clone().divideScalar(scale);

				return time.animationFrames().map(({ delta }: { delta: number }) => {
						const c = Math.cos(0.1 * delta * scale), s = Math.sin(0.1 * delta * scale);
						const orientation = new Quaternion(s * axis.x, s * axis.y, s * axis.z, c);
						return { orientation, scale: 1, angVel: axis };
				});
		}

		return Stream.of({
				orientation: new Quaternion(0, 0, 0, 1),
				scale: 1,
				angVel: new Vector3(0, 0, 0),
		});
}

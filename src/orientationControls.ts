import { Vector3, Quaternion } from 'three';
import { MainDOMSource } from '@cycle/dom';
import { TimeSource } from '@cycle/time';
import simpleRotation from './simpleRotation';
import gestures from './gestures';
import { Pose } from './Pose';
import interruptedBy from './interruptedBy';

export default function orientationControls(
		DOM: MainDOMSource,
		time: TimeSource,
		axis: Vector3,
) {
		const init = {
						orientation: new Quaternion(0, 0, 0, 1),
						scale: 1,
						angVel: axis,
		};
		return interruptedBy<Pose>(
				({ angVel }: Pose) => simpleRotation(time, angVel),
				() => gestures({ DOM }),
				init,
		).fold((pose: Pose, delta: Pose) => {
				const orientation = pose.orientation.premultiply(delta.orientation);
				const scale = pose.scale * delta.scale;
				return { orientation, scale, angVel: delta.angVel };
		}, init);
}

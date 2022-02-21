import { Quaternion, Vector3 } from 'three';
import { Stream } from 'xstream';
import { TimeSource } from '@cycle/time';

export default function simpleRotation(time: TimeSource, angVel: Vector3): Stream<Quaternion> {
		const scale = angVel.length();
		const axis = angVel.divideScalar(scale);

		return time.animationFrames().map(({ delta }: { delta: number }) => {
				const c = Math.cos(delta * scale), s = Math.sin(delta * scale);
				return new Quaternion(s * axis.x, s * axis.y, s * axis.z, c);
		}).fold((current: Quaternion, update: Quaternion) => {
				return current.premultiply(update);
		}, new Quaternion(0, 0, 0, 1));
}

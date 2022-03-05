import { Quaternion, Vector3 } from 'three';
import { Stream } from 'xstream';
import { MainDOMSource } from '@cycle/dom';
import { Gesture, Move, Twirl } from './types';
import mouseEvents from './mouseEvents';
import touchEvents from './touchEvents';
import { Pose, PoseUpdater } from '../Pose';

function events(sources: { DOM: MainDOMSource }): Stream<Gesture> {
		const events$ = Stream.merge(mouseEvents(sources), touchEvents(sources));
		return events$.endWhen(events$.filter(({ type }) => type === 'done' ));
}

function doMove({ x, y }: Move): Pose {
		x *= 0.01;
		y *= 0.01;
		const amount = Math.sqrt(x * x + y * y);
		const angVel = new Vector3(y, x, 0);
		if (amount > 0.00001) {
				const cos = Math.cos(amount), sin = Math.sin(amount);
				const orientation = new Quaternion(sin * y / amount, sin * x / amount, 0, cos);
				return { orientation, scale: 1, angVel };
		}

		return {
				orientation: new Quaternion(0, 0, 0, 1),
				scale: 1,
				angVel,
		};
}

function doTwirl({ angle, scale }: Twirl): Pose {
		if (angle > 0.001 || angle < -0.001) {
				const cos = Math.cos(-angle), sin = Math.sin(-angle);
				const orientation = new Quaternion(0, 0, sin, cos);
				return {
						orientation,
						scale: 1,
						angVel: new Vector3(0, 0, angle),
				};
		}

		return {
				orientation: new Quaternion(0, 0, 0, 1),
				scale,
				angVel: new Vector3(0, 0, 0),
		}
}

export default function gestures(sources: { DOM: MainDOMSource }): Stream<Pose> {
		return events(sources).map((gesture: Gesture) => {
				switch (gesture.type) {
						case 'move':
								return doMove(gesture);
						case 'twirl':
								return doTwirl(gesture);
				}
		});
}

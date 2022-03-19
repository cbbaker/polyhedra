import { timeDriver } from '@cycle/time';

export type Clock = {
		time: number,
		delta: number,
}

const time = timeDriver({});

const clock = time.animationFrames();

export default clock;

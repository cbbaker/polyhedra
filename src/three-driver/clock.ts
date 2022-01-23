import { animationFrameScheduler, interval } from 'rxjs';
import { scan } from 'rxjs/operators';

export type Clock = {
		time: number,
		delta: number,
}

const clock = interval(0, animationFrameScheduler).pipe(scan((previous: Clock, _: number) => {
    const time = performance.now();
    return { time, delta: time - previous.time };
}, { time: performance.now(), delta: 0 }));

export default clock;

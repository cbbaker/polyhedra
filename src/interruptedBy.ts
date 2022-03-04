import { Stream, Listener, Subscription } from 'xstream';

type StreamCreator<T> = (t: T) => Stream<T>;
type Interruptor<T> = () => Stream<T>;

class InterruptedByProducer<T> {
		base: StreamCreator<T>;
		interruptor: Interruptor<T>;
		baseSub?: Subscription;
		interruptorSub?: Subscription;
		last: T;

		constructor(base: StreamCreator<T>, interruptor: Interruptor<T>, init: T) {
				this.base = base;
				this.interruptor = interruptor;
				this.last = init;
				this.baseSub = undefined;
				this.interruptorSub = undefined;
		}

		start(listener: Listener<T>) {
				const baseListener = {
						next: (t: T) => {
								listener.next(t);
						},
						error: (e: Error) => {
								console.log('error in base: ' + e);
						},
						complete: () => {
								if (this.baseSub) {
										this.baseSub.unsubscribe();
										this.baseSub = undefined;
								}
						},
				};
				this.baseSub = this.base(this.last).subscribe(baseListener);
				const interruptorListener = {
						next: (t: T) => {
								if (this.baseSub) {
										this.baseSub.unsubscribe();
										this.baseSub = undefined;
								}
								this.last = t;
								listener.next(t);
						},
						error: (e: Error) => {
								console.log('error in interruptor: ' + e);
						},
						complete: () => {
								this.baseSub = this.base(this.last).subscribe(baseListener);
								this.interruptorSub = this.interruptor().subscribe(interruptorListener);
						},
				}
				this.interruptorSub = this.interruptor().subscribe(interruptorListener);
		}

		stop() {
				if (this.baseSub) {
						this.baseSub.unsubscribe();
						this.baseSub = undefined;
				}
				if (this.interruptorSub) {
						this.interruptorSub.unsubscribe();
						this.interruptorSub = undefined;
				}
		}
}

export default function interruptedBy<T>(base: StreamCreator<T>, interruptor: Interruptor<T>, init: T) {
		return Stream.create(new InterruptedByProducer(base, interruptor, init));
}

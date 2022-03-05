import { Stream } from 'xstream';
import concat from 'xstream/extra/concat';
import pairwise from 'xstream/extra/pairwise';
import { MainDOMSource } from '@cycle/dom';
import { Gesture } from './types';

type Delta = {
		x: number;
		y: number;
}

function eventToDelta(evt: MouseEvent): Delta {
		evt.preventDefault();
		const x = evt.offsetX, y = evt.offsetY;
		return { x, y };
}

const zero: Gesture = { type: 'move', x: 0, y: 0 };

export default function mouseEvents({ DOM }: { DOM: MainDOMSource } ): Stream<Gesture> {
		return concat(DOM.select('#canvas').events('mousedown')
				.take(1)
				.map((evt: MouseEvent) => {
						const startEvt = eventToDelta(evt)
						const start$ = Stream.fromArray([startEvt, startEvt]);
						const moves$ = DOM.events('mousemove')
								.endWhen(DOM.events('mouseup'))
								.map(eventToDelta);

						return concat(start$, moves$)
								.compose(pairwise)
								.map(([last, cur]: Delta[]) => {
										const x = cur.x - last.x;
										const y = cur.y - last.y;

										if (x === undefined || y === undefined) {
												return zero;
										}

										return { ...zero, x, y };
								})
				}).flatten(), Stream.of({ type: 'done' }));
}

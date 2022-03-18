import { run } from '@cycle/run';
import storageDriver, { StorageRequest } from '@cycle/storage';
import { captureClicks, makeHistoryDriver } from '@cycle/history';
import { timeDriver } from '@cycle/time';
import { Location } from 'history';
import { Stream } from 'xstream';
import { div, form, canvas, makeDOMDriver, VNode } from '@cycle/dom';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import makeThreeDriver, { Command } from './three-driver';
import { Config } from './three-driver/schema';
import polyhedronControls from './polyhedronControls'
import navMenu from './navMenu';
import { Sources } from './Sources';

function getState(url: string): string {
    const found = url.match(/\/([^\/]*)$/)
    if (!found || found.length < 2) {
        return url;
    }

    return found[1];
}

function computeControls(id: string, title: string, config: Config, sources: Sources) {
    return {
				...polyhedronControls(id, title, config, sources),
				state: config.id,
		};
}

function controls(sources: Sources) {
		const state$ = sources.history.map((location: Location) => getState(location.pathname));
    const configs$ = sources.three;
    const validatedState$ = Stream
        .combine(state$, configs$)
        .map(([state, configs]: [string, Config[]]) => configs.find((config: Config) => config.id === state))
        .filter((config: Config) => config !== undefined);

		const command: Command = { cmdType: 'initialize', props: { canvasId: 'canvas' } };

    const control$: Stream<{vdom: Stream<VNode>, command: Command, state: string, storage: Stream<StorageRequest> }> = validatedState$
        .map((config: Config) => {
            switch (config.id) {
                case 'icosahedron':
                    return computeControls('icosahedron', 'Interpolate', config, sources);
                case 'stellaOctangula':
                    return computeControls('stellaOctangula', 'Visibility', config, sources);
                case 'dodecahedron':
                    return computeControls('dodecahedron', 'Visibility', config, sources);
                case 'cuboctahedron':
                    return computeControls('cuboctahedron', 'Visibility', config, sources);
                case 'icosadodecahedron':
                    return computeControls('icosadodecahedron', 'Visibility', config, sources);
								default:
										return {
												vdom: Stream.of(div()),
												state: '',
												command,
												storage: Stream.from([]),
										};
            }
        })
        .startWith({
            vdom: Stream.of(div()),
						state: '',
            command,
            storage: Stream.from([]),
        });

    const command$ = control$
        .map(({ command }: { command: Command }) => command)
        .startWith({ cmdType: 'initialize', props: { canvasId: 'canvas' } });

    const storage$ = control$
        .map(({ storage }: { storage: Stream<StorageRequest> }) => storage)
        .flatten();

    const vdom$ = Stream.combine(control$, configs$)
        .map(([{ vdom: controls$, state }, configs]:
							[{ vdom: Stream<VNode>, state: string }, Config[]]) => {
            return controls$.map((controls) =>
                div('.row', {}, [
                    navMenu(state, configs),
                    div('.col-12.col-md-8', {}, [
                        canvas('#canvas', {
                            style: {
                                width: '100%',
                                height: '100%',
                                display: 'block',
                                touchAction: 'none',
                            }
                        }),
                    ]),
                    div('.col-12.col-md-4', {}, [
                        div('.card', {}, [
                            div('.card-header', {}, ['Controls']),
                            div('.card-body', {}, [
                                form('#controls', {}, [
                                    controls,
                                ]),
                            ]),
                        ])
                    ]),
                ]))
        })
        .flatten()
        .startWith(canvas('#canvas', {
            style: {
                width: '100%',
                height: '100%',
                display: 'block',
                touchAction: 'none',
            }
        }));

    return { vdom: vdom$, command: command$, storage: storage$ };
}

function main(sources: Sources) {
    const { vdom: vdom$, command: command$, storage: storage$ } = controls(sources)
    const sinks = {
        DOM: vdom$,
        three: command$,
        storage: storage$,
    };
    return sinks;
}

const drivers = {
    DOM: makeDOMDriver('#app'),
    three: makeThreeDriver(),
    storage: storageDriver,
		time: timeDriver,
		history: captureClicks(makeHistoryDriver()),
};

run(main, drivers);

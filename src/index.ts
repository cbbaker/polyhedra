import { run } from '@cycle/run';
import storageDriver, { ResponseCollection, StorageRequest } from '@cycle/storage';
import { timeDriver, TimeSource } from '@cycle/time';
import { Stream } from 'xstream';
import { div, form, canvas, makeDOMDriver, MainDOMSource, VNode } from '@cycle/dom';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import makeThreeDriver, { Command } from './three-driver';
import { Config } from './three-driver/schema';
import dodecahedronControls from './dodecahedronControls';
import icosahedronControls from './icosahedronControls';
import stellaOctangulaControls from './stellaOctangulaControls';
import cuboctahedronControls from './cuboctahedronControls';
import navMenu from './navMenu';

export type Sources = {
		DOM: MainDOMSource,
		three: Stream<Config[]>,
		storage: ResponseCollection,
		time: TimeSource,
}

function getState(url: string): string {
    const found = url.match(/\/([^\/]*)$/)
    if (!found || found.length < 2) {
        return url;
    }

    return found[1];
}

function controls({ DOM, three, storage, time }: Sources) {
    const state$ = DOM.select('.nav-link')
        .events('click')
        .map((event: Event) => {
            event.preventDefault();
            return (event.currentTarget as Element).id;
        })
        .startWith(getState(window.location.href))
    const configs$ = three;
    const validatedState$ = Stream
        .combine(state$, configs$)
        .map(([state, configs]: [string, Config[]]) => configs.find((config: Config) => config.id === state))
        .filter((config: Config) => config !== undefined)

		const command: Command = { cmdType: 'initialize', props: { canvasId: 'canvas' } };

    const control$: Stream<{vdom: Stream<VNode>, command: Command, storage: Stream<StorageRequest> }> = validatedState$
        .map((config: Config) => {
            switch (config.id) {
                case 'icosahedron':
                    return icosahedronControls(DOM, config, storage, time);
                case 'stellaOctangula':
                    return stellaOctangulaControls(DOM, config, storage, time);
                case 'dodecahedron':
                    return dodecahedronControls(DOM, config, storage, time);
                case 'cuboctahedron':
                    return cuboctahedronControls(DOM, config, storage, time);
            }
        })
        .startWith({
            vdom: Stream.of(div()),
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
        .map(([{ vdom: controls$, command: { cmdType: currentCmd } }, configs]:
            [{ vdom: Stream<VNode>, command: { cmdType: string } }, Config[]]) => {
            return controls$.map((controls) =>
                div('.row', {}, [
                    navMenu(currentCmd, configs),
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
};

run(main, drivers);

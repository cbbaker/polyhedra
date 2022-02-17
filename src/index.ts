import { run } from '@cycle/run';
import storageDriver, { ResponseCollection, StorageRequest } from '@cycle/storage';
import { Stream } from 'xstream';
import { div, form, canvas, makeDOMDriver, MainDOMSource, VNode } from '@cycle/dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import makeThreeDriver, { Config, Command } from './three-driver';
import dodecahedronControls from './dodecahedronControls';
import icosahedronControls from './icosahedronControls';
import navMenu from './navMenu';

function getState(url: string): string {
    const found = url.match(/\/([^\/]*)$/)
    if (!found || found.length < 2) {
        return url;
    }

    return found[1];
}

function controls({ DOM, three, storage }: { DOM: MainDOMSource, three: Stream<Config>, storage: ResponseCollection }) {
    const state$ = DOM.select('.nav-link')
        .events('click')
        .map((event: Event) => {
            event.preventDefault();
            return (event.currentTarget as Element).id;
        })
        .startWith(getState(window.location.href))
    const config$ = three;
    const validatedState$ = Stream
        .combine(state$, config$)
        .filter(([state, config]: [string, Config]) => config.cmdType.indexOf(state) >= 0)

    const control$ = validatedState$
        .map(([cmdType]: [string, Config]) => {
            switch (cmdType) {
                case 'icosahedron':
                    return icosahedronControls(DOM, storage);
                case 'dodecahedron':
                    return dodecahedronControls(DOM, storage);
            }
        })
        .startWith({
            vdom: Stream.of(div()),
            command: { cmdType: 'initialize', props: { canvasId: 'canvas' } },
            storage: Stream.from([]),
        })

    const command$ = control$
        .map(({ command }: { command: Command }) => command)
        .startWith({ cmdType: 'initialize', props: { canvasId: 'canvas' } });

    const storage$ = control$
        .map(({ storage }: { storage: Stream<StorageRequest> }) => storage)
        .flatten();

    const vdom$ = Stream.combine(control$, config$)
        .map(([{ vdom: controls$, command: { cmdType: currentCmd } }, config]:
            [{ vdom: Stream<VNode>, command: { cmdType: string } }, Config]) => {
            return controls$.map((controls) =>
                div('.row', {}, [
                    navMenu(currentCmd, config),
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

function main(sources: { DOM: MainDOMSource, three: Stream<Config>, storage: ResponseCollection }) {
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
};

run(main, drivers);

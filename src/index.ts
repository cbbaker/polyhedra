import { Observable } from 'rxjs';
import { run } from '@cycle/run';
import { Stream } from 'xstream';
import { div, span, ul, li, form, canvas, nav, a, button, makeDOMDriver, MainDOMSource, VNode } from '@cycle/dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import makeThreeDriver, { Config, Command } from './three-driver';
import dodecahedronControls from './dodecahedronControls';
import icosahedronControls from './icosahedronControls';

function navMenu(items: { id: string, href: string, title: string }[]) {
    return nav('.navbar.navbar-expand-lg.navbar-light.bg-light', {}, [
        div('.container-fluid', {}, [
            a('.navbar-brand', { attrs: { href: '/' } }, 'Polyhedra'),
            button('.navbar-toggler', {
                attrs: {
                    type: 'button',
                    'data-bs-toggle': 'collapse',
                    'data-bs-target': '#navbarNav',
                    'aria-controls': 'navbarNav',
                    'aria-expaned': false,
                    'aria-label': 'Toggle navagation',
                }
            }, [
                span('.navbar-toggler-icon'),
            ]),
            div('#navbarNav.collapse.navbar-collapse', {}, [
                ul('.navbar-nav', {}, [
                    ...items.map(({ id, href, title }) =>
                        li('nav-item', {}, [
                            a('.nav-link', { attrs: { href, id } }, [title])
                        ])),
                ]),
            ]),
        ]),
    ]);
}

function getState(url: string): string {
    const found = url.match(/\/([^\/]*)$/)
    if (!found || found.length < 2) {
        return url;
    }

    return found[1];
}

function controls({ DOM, three }: { DOM: MainDOMSource, three: Observable<Config> }) {
    const state$ = DOM.select('.nav-link')
        .events('click')
        .map((event: Event) => {
            event.preventDefault();
            return (event.currentTarget as Element).id;
        })
        .startWith(getState(window.location.href))
    const config$ = Stream.from(three) as Stream<Config>;
    const validatedState$ = Stream
        .combine(state$, config$)
        .filter(([state, config]: [string, Config]) => config.cmdType.indexOf(state) >= 0)

    const control$ = validatedState$
        .map(([cmdType]: [string, Config]) => {
            switch (cmdType) {
                case 'icosahedron':
                    return icosahedronControls(DOM);
                case 'dodecahedron':
                    return dodecahedronControls(DOM);
            }
        })
        .startWith({
            vdom: Stream.of(div()),
            command: { cmdType: 'initialize', props: { canvasId: 'canvas' } }
        })

    const command$ = control$.map(({ command }: { command: Command }) => command)
        .startWith({ cmdType: 'initialize', props: { canvasId: 'canvas' } });

    const vdom$ = Stream.combine(control$, config$)
        .map(([{ vdom: controls$ }, config]: [{ vdom: Stream<VNode> }, Config]) => {
            return controls$.map((controls) =>
                div('.row', {}, [
                    navMenu(config.cmdType.map((cmdType: string) => {
                        const id = cmdType.toLocaleLowerCase();
                        const href = '/' + id;
                        const title = cmdType[0].toLocaleUpperCase() + id.slice(1);
                        return { id, href, title };
                    })),
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

    return { vdom: vdom$, command: command$ };
}

function main(sources: { DOM: MainDOMSource, three: Observable<Config> }) {
    const { vdom: vdom$, command: command$ } = controls(sources)
    const sinks = {
        DOM: vdom$,
        three: command$,
    };
    return sinks;
}

const drivers = {
    DOM: makeDOMDriver('#app'),
    three: makeThreeDriver(),
};

run(main, drivers);

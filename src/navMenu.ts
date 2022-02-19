import { Config } from './three-driver';
import { div, span, ul, li, nav, a, button, VNode } from '@cycle/dom';

export default function navMenu(currentCmd: string, configs: Config[]): VNode {
    const items = configs.map((config: Config) => config.cmdType).map((cmdType: string) => {
        const id = cmdType.toLocaleLowerCase();
        const href = '/' + id;
        const title = cmdType[0].toLocaleUpperCase() + id.slice(1);
        const active = cmdType === currentCmd;

        return li('nav-item', {}, [
            a(`.nav-link${active ? '.active' : ''}`, { attrs: { href, id } }, [title])
        ]);
    });

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
                ul('.navbar-nav', {}, items),
            ]),
        ]),
    ]);
}


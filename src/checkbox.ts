import { Stream } from 'xstream';
import { div, input, label, MainDOMSource, VNode } from '@cycle/dom';


export type Props = {
    id: string,
    title: string,
    value: boolean,
}

export type Sources = {
    DOM: MainDOMSource,
    props: Stream<Props>
};

export type Sinks = {
    DOM: Stream<VNode>,
    value: Stream<boolean>,
};

export default function Checkbox({ DOM, props }: Sources): Sinks {
    const newValue$ = DOM
        .select('.checkbox')
        .events('input')
        .map((ev: InputEvent) => (ev.target as HTMLInputElement).checked);

    const state$ = props
        .map((props: Props) => newValue$
            .map((value: boolean) => {
                return { ...props, value };
            })
            .startWith(props)
        )
        .flatten()
        .remember();

    const vdom$ = state$
        .map(({ id, title, value }: Props) => {
            const checked = value ? { checked: '' } : {};
            return div('.form-check.mb-3', [
                input(`#${id}.checkbox.form-check-input`, {
                    attrs: { ...checked, type: 'checkbox' }
                }),
                label('.form-check-label', { attrs: { for: id } }, title),
            ])
        });

    return {
        DOM: vdom$,
        value: state$.map(({ value }: Props) => value),
    };
}

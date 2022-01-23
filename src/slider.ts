import { Stream } from 'xstream';
import { div, input, label, MainDOMSource, VNode } from '@cycle/dom';


export type Props = {
    id: string,
    title: string,
    min: number,
    max: number,
    step: number,
    value: number,
}

export type Sources = {
    DOM: MainDOMSource,
    props: Stream<Props>
};

export type Sinks = {
    DOM: Stream<VNode>,
    value: Stream<number>,
};

export default function Slider({ DOM, props }: Sources): Sinks {
    const newValue$ = DOM
        .select('.slider')
        .events('input')
        .map((ev: InputEvent) => (ev.target as HTMLInputElement).value);

    const state$ = props
        .map((props: Props) => newValue$
            .map((val: string) => {
                const value = parseFloat(val);
                return { ...props, value };
            })
            .startWith(props)
        )
        .flatten()
        .remember();

    const vdom$ = state$
        .map(({ id, title, min, max, step, value }: Props) =>
            div('.labeled-slider.mb-3', [
                label('.label.form-label', { attrs: { for: id } }, title),
                input(`#${id}.slider.form-range`, {
                    attrs: { type: 'range', min, max, step, value }
                }),
            ]));

    return {
        DOM: vdom$,
        value: state$.map(({ value }: Props) => value),
    };
}

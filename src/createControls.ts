import { Stream } from 'xstream';
import { div, h4, MainDOMSource, VNode } from '@cycle/dom';
import { Command } from './three-driver/index';
import isolate from '@cycle/isolate';
import Slider, { Props as SliderProps } from './slider';
import Checkbox, { Props as CheckboxProps } from './checkbox';

type SliderSchemaEntry = {
    type: 'slider';
    props: SliderProps;
}

type CheckboxSchemaEntry = {
    type: 'checkbox';
    props: CheckboxProps;
}

export type Schema = (SliderSchemaEntry | CheckboxSchemaEntry)[];

export default function createControls(cmdType: string, title: string, schema: Schema, DOM: MainDOMSource): { vdom: Stream<VNode>, command: Command } {
    const controls: (Stream<VNode>)[] = [];
    const values: (Stream<number | boolean>)[] = [];
    schema.forEach((entry: (SliderSchemaEntry | CheckboxSchemaEntry)) => {
        let result;
        switch (entry.type) {
            case 'checkbox':
                result = isolate(Checkbox, entry.props.id)({
                    DOM,
                    props: Stream.of(entry.props),
                });
                break;
            case 'slider':
                result = isolate(Slider, entry.props.id)({
                    DOM,
                    props: Stream.of(entry.props),
                });
                break;
        }
        controls.push(result.DOM);
        values.push(result.value);
    });

    const vdom$ = Stream.combine(...controls)
        .map((controls: VNode[]) =>
            div('.form-group', [
                h4(title),
                ...controls,
            ]));

    const controls$ = Stream.combine(...values)
        .map((values) => {
            const keys = schema.map(({ props: { id } }) => id);
            const result = {} as Record<string, number | boolean>;
            for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = values[i];
            }
            return result;
        });

    const command = { cmdType, controls: controls$ } as Command;

    return { vdom: vdom$, command };
}

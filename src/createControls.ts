import { Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import { div, h4, MainDOMSource, VNode } from '@cycle/dom';
import { ResponseCollection, StorageRequest, StorageSaveRequest } from '@cycle/storage';
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

function savedControls(
    cmdType: string,
    defaults: Record<string, number | boolean>,
    storage: ResponseCollection): Stream<Record<string, number | boolean>> {
    return storage.local.getItem(`controls:${cmdType}`)
        .compose(dropRepeats())
        .debug(`read ${cmdType}`)
        .map(JSON.parse)
        .filter(values => !!values)
        .startWith(defaults);
}

export default function createControls(
    cmdType: string,
    title: string,
    schema: Schema,
    DOM: MainDOMSource,
    storage: ResponseCollection,
): { vdom: Stream<VNode>, command: Command, storage: Stream<StorageRequest> } {
    const controls: (Stream<VNode>)[] = [];
    const values: (Stream<number | boolean>)[] = [];
    const defaults = schema.reduce((defaults: Record<string, number | boolean>, entry) => {
        defaults[entry.props.id] = entry.props.value;
        return defaults;
    }, {});
    const saved$ = savedControls(cmdType, defaults, storage);
    schema.forEach((entry: (SliderSchemaEntry | CheckboxSchemaEntry)) => {
        let result;
        switch (entry.type) {
            case 'checkbox':
                result = isolate(Checkbox, entry.props.id)({
                    DOM,
                    props: saved$
                        .map(saved => ({ ...entry.props, value: saved[entry.props.id] }) as CheckboxProps)
                        .debug(`props ${entry.props.id}`),
                });
                break;
            case 'slider':
                result = isolate(Slider, entry.props.id)({
                    DOM,
                    props: saved$
                        .map(saved => ({ ...entry.props, value: saved[entry.props.id] }) as SliderProps)
                        .debug(`props ${entry.props.id}`),
                });
                break;
        }
        controls.push(result.DOM);
        values.push(result.value.debug(`value: ${entry.props.id}`));
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
        }).remember();

    const storage$ = controls$.map(controls => ({
        target: 'local',
        action: 'setItem',
        key: `controls:${cmdType}`,
        value: JSON.stringify(controls),
    }) as StorageRequest).debug('storage writes');

    const command = { cmdType, controls: controls$ } as Command;

    return { vdom: vdom$, command, storage: storage$ };
}

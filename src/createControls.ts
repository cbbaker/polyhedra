import { Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import { div, h4, MainDOMSource, VNode } from '@cycle/dom';
import { ResponseCollection, StorageRequest } from '@cycle/storage';
import { Schema, Item } from './three-driver/schema';
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

type SchemaEntry = SliderSchemaEntry | CheckboxSchemaEntry;

type Values = number | boolean | number[];

type Table = Record<string, Values>;

function savedControls(
    cmdType: string,
    defaults: Table,
    storage: ResponseCollection): Stream<Table> {
    return storage.local.getItem(`controls:${cmdType}`)
        .compose(dropRepeats())
        .map(JSON.parse)
        .filter(values => !!values)
        .startWith(defaults);
}

function createControlSchema(schema: Schema) {
    return schema.map((item: Item) => {
        switch (item.type) {
            case 'boolean':
                return {
                    type: 'checkbox',
                    props: {
                        id: item.id,
                        title: item.title,
                        value: item.initial,
                    },
                } as CheckboxSchemaEntry;
            case 'range':
                return {
                    type: 'slider',
                    props: {
                        id: item.id,
                        title: item.title,
                        min: item.min,
                        max: item.max,
                        step: item.step,
                        value: item.initial,
                    },
                } as SliderSchemaEntry;
        }
    });
}

function makeControlStreams(cmdType: string, DOM: MainDOMSource, storage: ResponseCollection, controlSchema: SchemaEntry[]) {
    const controls: (Stream<VNode>)[] = [];
    const values: (Stream<Values>)[] = [];
    const defaults = controlSchema.reduce((defaults: Table, entry) => {
        defaults[entry.props.id] = entry.props.value;
        return defaults;
    }, {});
    const saved$ = savedControls(cmdType, defaults, storage);
    controlSchema.forEach((entry: SchemaEntry) => {
        let result;
        switch (entry.type) {
            case 'checkbox':
                result = isolate(Checkbox, entry.props.id)({
                    DOM,
                    props: saved$
                        .map(saved => ({ ...entry.props, value: saved[entry.props.id] }) as CheckboxProps)
                });
                break;
            case 'slider':
                result = isolate(Slider, entry.props.id)({
                    DOM,
                    props: saved$
                        .map(saved => ({ ...entry.props, value: saved[entry.props.id] }) as SliderProps)
                });
                break;
        }
        controls.push(result.DOM);
        values.push(result.value);
    });

    return { controls, values }
}

export default function createControls(
    cmdType: string,
    title: string,
    schema: Schema,
    DOM: MainDOMSource,
    storage: ResponseCollection,
): { vdom: Stream<VNode>, props: Record<string, Stream<Values>>, storage: Stream<StorageRequest> } {
    const controlSchema = createControlSchema(schema);

    const { controls, values } = makeControlStreams(cmdType, DOM, storage, controlSchema);

    const vdom$ = Stream.combine(...controls)
        .map((controls: VNode[]) =>
            div('.form-group', [
                h4(title),
                ...controls,
            ]));

    const keys = controlSchema.map(({ props: { id } }: SchemaEntry) => id);

    const controls$ = Stream.combine(...values)
        .map((values) => {
            const result = {} as Table;
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
    }) as StorageRequest);

    const props = keys.reduce((controls: Record<string, Stream<Values>>, key: string, index: number) => {
        controls[key] = values[index];
        return controls
    }, {});

    return { vdom: vdom$, props, storage: storage$ };
}

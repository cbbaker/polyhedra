import { MainDOMSource } from '@cycle/dom';
import { ResponseCollection } from '@cycle/storage';
import createControls, { Schema } from './createControls';

const schema: Schema = [
    {
        type: 'slider',
        props: {
            id: 'interpolate',
            title: 'Amount',
            min: 0.5,
            max: 1,
            step: 0.01,
            value: 0.62,
        },
    },
];

export default function dodecahedronControls(DOM: MainDOMSource, storage: ResponseCollection) {
    return createControls('icosahedron', 'Interpolate', schema, DOM, storage);
}

import { MainDOMSource } from '@cycle/dom';
import createControls, { Schema } from './createControls';

const schema: Schema = [
    {
        type: 'checkbox',
        props: {
            id: 'showShell',
            title: 'Show shell',
            value: true,
        },
    },
    {
        type: 'checkbox',
        props: {
            id: 'showSkeleton',
            title: 'Show skeleton',
            value: false,
        },
    },
    {
        type: 'slider',
        props: {
            id: 'opacity',
            title: 'Opacity',
            min: 0,
            max: 1,
            step: 0.05,
            value: 0.5,
        },
    },
    {
        type: 'slider',
        props: {
            id: 'cubeCount',
            title: 'Cube count',
            min: 0,
            max: 5,
            step: 1,
            value: 0,
        },
    },
    {
        type: 'slider',
        props: {
            id: 'evenTetrahedraCount',
            title: 'Even Tetrahedra count',
            min: 0,
            max: 5,
            step: 1,
            value: 0,
        },
    },
    {
        type: 'slider',
        props: {
            id: 'oddTetrahedraCount',
            title: 'Odd Tetrahedra count',
            min: 0,
            max: 5,
            step: 1,
            value: 0,
        },
    },
];

export default function dodecahedronControls(DOM: MainDOMSource) {
    return createControls('dodecahedron', 'Visibility', schema, DOM);
}

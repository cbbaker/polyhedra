import { MainDOMSource } from '@cycle/dom';
import { ResponseCollection } from '@cycle/storage';
import { Schema } from './three-driver/schema';
import createControls from './createControls';

export default function icosahedronControls(DOM: MainDOMSource, schema: Schema, storage: ResponseCollection) {
    return createControls('icosahedron', 'Interpolate', schema, DOM, storage);
}

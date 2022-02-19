import { MainDOMSource } from '@cycle/dom';
import { ResponseCollection } from '@cycle/storage';
import { Schema } from './three-driver/schema';
import createControls from './createControls';

export default function dodecahedronControls(DOM: MainDOMSource, schema: Schema, storage: ResponseCollection) {
    return createControls('dodecahedron', 'Visibility', schema, DOM, storage);
}

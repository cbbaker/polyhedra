import { Vector3 } from 'three';
import { MainDOMSource } from '@cycle/dom';
import { ResponseCollection } from '@cycle/storage';
import { TimeSource } from '@cycle/time';
import { Schema } from './three-driver/schema';
import { Command } from './three-driver';
import { Command as DodecahedronCommand } from './three-driver/dodecahedron';
import simpleRotation from './simpleRotation';
import createControls from './createControls';

export default function dodecahedronControls(
		DOM: MainDOMSource,
		schema: Schema,
		storage: ResponseCollection,
		time: TimeSource,
) {
		const controlSchema = schema.filter(({ id }) => (id !== 'orientation'));
		const controls = createControls('dodecahedron', 'Visibility', controlSchema, DOM, storage);

		const orientation$ = simpleRotation(time, new Vector3(0.001, 0.001, 0.001));

		const inner = (controls.command as DodecahedronCommand).controls;

		return {
				...controls,
				command: {
						cmdType: 'dodecahedron',
						controls: {
								...inner,
								orientation: orientation$,
						}
				} as Command,
		};
}

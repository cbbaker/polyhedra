import { Vector3 } from 'three';
import { MainDOMSource } from '@cycle/dom';
import { ResponseCollection } from '@cycle/storage';
import { TimeSource } from '@cycle/time';
import { Schema } from './three-driver/schema';
import { Command } from './three-driver/stellaOctangula';
import { Command as StellaOctangulaCommand } from './three-driver/stellaOctangula';
import simpleRotation from './simpleRotation';
import createControls from './createControls';

export default function stellaOctangulaControls(
		DOM: MainDOMSource,
		schema: Schema,
		storage: ResponseCollection,
		time: TimeSource,
) {
		const controlSchema = schema.filter(({ id }) => (id !== 'orientation'));

		const controls = createControls('stellaOctangula', 'Colors', controlSchema, DOM, storage);

		const orientation$ = simpleRotation(time, new Vector3(0.001, 0.001, 0.001));

		const inner = (controls.command as StellaOctangulaCommand).controls;

		return {
				...controls,
				command: {
						cmdType: 'stellaOctangula',
						controls: {
								...inner,
								orientation: orientation$,
						},
				} as Command,
		};
}

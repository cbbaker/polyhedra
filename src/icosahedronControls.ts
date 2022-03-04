import { Stream } from 'xstream';
import { Vector3, Quaternion } from 'three';
import { MainDOMSource, VNode } from '@cycle/dom';
import { StorageRequest, ResponseCollection } from '@cycle/storage';
import { TimeSource } from '@cycle/time';
import { Config } from './three-driver/schema';
import { Command } from './three-driver';
import orientationControls from './orientationControls';
import simpleRotation from './simpleRotation';
import createControls from './createControls';

export default function icosahedronControls(
		DOM: MainDOMSource,
		config: Config,
		storageResponses: ResponseCollection,
		time: TimeSource,
): { vdom: Stream<VNode>, command: Command, storage: Stream<StorageRequest> } {
		const controlSchema = config.schema.filter(({ id }) => (id !== 'orientation'));

		const { vdom, props, storage } = createControls('icosahedron', 'Interpolate', controlSchema, DOM, storageResponses);

		const orientation$ = orientationControls(DOM, time, new Vector3(0.001, 0.001, 0.001));

		const newProps = {
				...props,
				orientation: orientation$,
		};

		const producer = new config.ctor(newProps);

		const command: Command = { cmdType: 'addMesh', props: { producer } };

		return { vdom, command, storage };
}

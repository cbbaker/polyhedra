import { Stream } from 'xstream';
import concat from 'xstream/extra/concat';
import { Vector3, Quaternion } from 'three';
import { MainDOMSource, VNode } from '@cycle/dom';
import { StorageRequest, ResponseCollection } from '@cycle/storage';
import { TimeSource } from '@cycle/time';
import { Config } from './three-driver/schema';
import { Command } from './three-driver';
import { Sources } from './Sources';
import simpleRotation from './simpleRotation';
import gestures from './gestures';
import createControls from './createControls';
import orientationControls from './orientationControls';
import interruptedBy from './interruptedBy';

export default function polyhedronControls(
		id: string,
		title: string,
		config: Config,
		{ DOM, storage: storageResponses, time }: Sources,
): { vdom: Stream<VNode>, command: Command, storage: Stream<StorageRequest> } {
		const controlSchema = config.schema.filter(({ id }) => (id !== 'pose'));

		const { vdom, props, storage } = createControls(id, title, controlSchema, DOM, storageResponses);

		const orientation$ = orientationControls(DOM, time, new Vector3(0.001, 0.001, 0.001));

		const newProps = {
				...props,
				pose: orientation$,
		};

		const producer = new config.ctor(newProps);

		const command: Command = { cmdType: 'addMesh', props: { producer } };

		return { vdom, command, storage };
}

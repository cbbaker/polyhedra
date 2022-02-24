import { Stream } from 'xstream'
import * as three from 'three';
import MeshProducer from './MeshProducer';

export type Range = {
    type: 'range';
    id: string;
    title: string;
    min: number;
    max: number;
    step: number;
    initial: number;
};

export type Boolean = {
    type: 'boolean';
    id: string;
    title: string;
    initial: boolean;
};

export type Quaternion = {
    type: 'quaternion';
    id: string;
    title: string;
    initial: three.Quaternion;
}

export type Item = Range | Boolean | Quaternion;

export type Schema = Item[];

export type Value = number | boolean | three.Quaternion;

export type ControlState = Record<string, Stream<Value>>;

export interface MeshProducerConstructor {
		new (controlState: ControlState): MeshProducer;
}

export type Config = {
		id: string;
		title: string;
		schema: Schema;
		ctor: MeshProducerConstructor;
}


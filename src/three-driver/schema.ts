import * as three from 'three';

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

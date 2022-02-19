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

export type Item = Range | Boolean;

export type Schema = Item[];

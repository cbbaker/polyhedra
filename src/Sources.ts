import { Stream } from 'xstream';
import { MainDOMSource } from '@cycle/dom';
import { Config } from './three-driver/schema';
import { ResponseCollection } from '@cycle/storage';
import { TimeSource } from '@cycle/time';
import { Location } from 'history';

export type Sources = {
		DOM: MainDOMSource,
		three: Stream<Config[]>,
		storage: ResponseCollection,
		time: TimeSource,
		history: Stream<Location>,
}

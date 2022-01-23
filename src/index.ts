import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { run } from '@cycle/rxjs-run';
import { div, form, makeDOMDriver } from '@cycle/dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function controls() {
		return div('.card', {}, [
				div('.card-header', {}, ['Controls']),
				div('.card-body', {}, [
						form('#controls'),
				]),
		]);
}


function main() {
  const sinks = {
			DOM: controls(),
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

run(main, drivers);

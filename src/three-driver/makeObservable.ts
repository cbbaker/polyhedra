import { Stream } from 'xstream';
import { Observable, Subscriber } from 'rxjs';

export default function makeObservable<T>(in$: Stream<T>): Observable<T> {
    return new Observable((subscriber: Subscriber<T>) => {
        in$.addListener(subscriber);
        return function() {
            in$.removeListener(subscriber);
        }
    });
}


import * as three from 'three';
import { Stream } from 'xstream'
import sampleCombine from 'xstream/extra/sampleCombine';
import clock, { Clock } from './clock';
import dodecahedron, { Command as DodecahedronCommand } from './dodecahedron';
import icosahedron, { Command as IcosahedronCommand } from './icosahedron';

export type Config = {
    cmdType: string[];
}

type InitializeCommand = {
    cmdType: 'initialize';
    props: {
        canvasId: string;
    }
}

export type Command = InitializeCommand | DodecahedronCommand | IcosahedronCommand;

type State = {
    canvas: HTMLCanvasElement;
    camera: three.PerspectiveCamera;
    renderer: three.Renderer;
    scene: three.Scene;
}


type AddMesh = {
    type: 'addMesh';
    reducer: (scene: three.Scene) => three.Object3D
};
type Initialize = {
    type: 'initialize';
    reducer: () => State;
}

type ReducerType = Initialize | AddMesh;

function initialize({ props: { canvasId } }: InitializeCommand) {
    const canvas = document.querySelector<HTMLCanvasElement>(`#${canvasId}`);
    const width = canvas.clientWidth
    const height = width * 9 / 16;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const camera = new three.PerspectiveCamera(70, canvas.width / canvas.height, 0.01, 10);
    camera.position.z = 6;

    const scene = new three.Scene();

    const ambient = new three.AmbientLight(0x808080);
    scene.add(ambient);

    const right = new three.PointLight;
    right.position.set(5, 5, 5);
    scene.add(right);

    const renderer = new three.WebGLRenderer({
        antialias: true,
        canvas,
    });
    renderer.setSize(canvas.width, canvas.height);

    return () => ({ canvas, camera, renderer, scene })
};

function reducer(reducerType: ReducerType): (state: State) => State {
    switch (reducerType.type) {
        case 'initialize':
            return reducerType.reducer;
        case 'addMesh':
            return function(state: State): State {
                reducerType.reducer(state.scene);
                return state;
            }
    }
}

export default function makeThreeDriver() {
    return function(outgoing$: Stream<Command>): Stream<Config> {
        const state$ = outgoing$.map((command: Command) => {
            switch (command.cmdType) {
                case 'initialize':
                    return Stream.of({
                        type: 'initialize',
                        reducer: initialize(command),
                    } as ReducerType);

                case 'dodecahedron':
                    return dodecahedron(command).map(addMesh => ({
                        type: 'addMesh',
                        reducer: addMesh,
                    }) as ReducerType);

                case 'icosahedron':
                    return icosahedron(command).map(addMesh => ({
                        type: 'addMesh',
                        reducer: addMesh,
                    }) as ReducerType);
            }
        })
            .flatten()
            .map(reducer)
            .fold((state: State, reducer: ((state: State) => State)) => reducer(state), null)

        const frame$ = clock
            .compose(sampleCombine(state$))
            .map(([_, state]: [any, State]): State => state);

        frame$.subscribe({
            next({ canvas, camera, renderer, scene }: State) {
                // if (cameraZ) {
                // 		camera.position.z = cameraZ;
                // }
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                const needsResize = canvas.width !== width || canvas.height !== height;
                if (needsResize) {
                    renderer.setSize(width, height, false);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                }
                renderer.render(scene, camera);
            },
            error: (error: Error) => { console.error(error) },
            complete: () => { },
        });

        return Stream.of({ cmdType: ['dodecahedron', 'icosahedron'] });
    }
}

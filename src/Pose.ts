import { Quaternion, Vector3 } from 'three';

export type Pose = {
		orientation: Quaternion;
		scale: number;
		angVel: Vector3;
}

export type PoseUpdater = (pose: Pose) => Pose;

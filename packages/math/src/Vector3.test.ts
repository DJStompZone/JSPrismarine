import { describe, expect, it } from 'vitest';

import { Vector3 } from './Vector3';

describe('math', () => {
    describe('Vector3', () => {
        const vector = new Vector3(1.5, 0, 2.75);

        it('should retrieve values correctly', () => {
            expect(vector.getX()).toBe(1.5);
            expect(vector.getY()).toBe(0);
            expect(vector.getZ()).toBe(2.75);
        });

        it('should set and get Y coordinate correctly', () => {
            vector.setY(10);
            expect(vector.getY()).toBe(10);
        });

        it('should floor the vector correctly', () => {
            const flooredVector = new Vector3(1.5, 0, 2.75).floor();
            expect(flooredVector.getX()).toBe(1);
            expect(flooredVector.getY()).toBe(0);
            expect(flooredVector.getZ()).toBe(2);
        });

        it('should compare two vectors correctly', () => {
            const vector1 = new Vector3(1, 2, 3);
            const vector2 = new Vector3(1, 2, 3);
            const vector3 = new Vector3(4, 5, 6);

            expect(vector1.equals(vector2)).toBe(true);
            expect(vector1.equals(vector3)).toBe(false);
        });
    });
});

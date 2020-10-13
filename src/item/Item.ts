interface ItemProps {
    id: number,
    name: string,
    meta?: number,
    nbt?: any,
    count?: number
};

export default class Item {
    /** @type {number} */
    id: number
    /** @type {number} */
    meta?: number
    /** @type {string} */
    name: string
    /** @type {any} */
    nbt?: any
    /** @type {number} */
    count?: number

    constructor({ id, name, meta, count, nbt }: ItemProps) {
        this.id = id;
        this.meta = meta;
        this.count = count;
        this.nbt = nbt || null;
        this.name = name;
    }
}

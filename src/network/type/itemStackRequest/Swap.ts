import ItemStackRequestSlotInfo from './ItemStackRequestSlotInfo';

class Swap {
    public from: ItemStackRequestSlotInfo;
    public to: ItemStackRequestSlotInfo;

    constructor({
        from,
        to
    }: {
        from: ItemStackRequestSlotInfo;
        to: ItemStackRequestSlotInfo;
    }) {
        this.from = from;
        this.to = to;
    }
}

export default Swap;

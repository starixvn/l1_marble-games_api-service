export class Market {
    marketID: number;
    marketNameKey: string;
    marketName: Record<string, string>;
    selection: Array<Selection>
}

export class Selection {
    selectionID: number;
    selectionNameKey: string;
    selectionName: Record<string, string>;
    selectionNameLongKey: string;
    selectionNameLong: Record<string, string>;
    isSuspended: boolean;
    isTradable: boolean;
    isClosed: boolean;
    price: number;
}

const mockEventStore = []
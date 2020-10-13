export interface IPoolable {
    reset?(): void;
    recover?(): void;
}
export interface IMetadataInfo {
    uniqueType: string;
    uid: string;
}

export interface IMetadatable {
    getMetadata(): IMetadataInfo;
}
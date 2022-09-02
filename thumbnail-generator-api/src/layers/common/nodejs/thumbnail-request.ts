export const enum ERequestStatus {
	Received = "Received",
	InProgress = "InProgress",
	Finished = "Finished",
	Failed = "Failed",
}

export interface IThumbnailRequest {
	requestId: string;
	storageLocation: string;
	requestStatus: ERequestStatus;
	created: string;
	modified?: string;
	thumbnails?: string[];
}

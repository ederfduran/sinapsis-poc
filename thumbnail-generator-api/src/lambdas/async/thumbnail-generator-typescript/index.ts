import { SQSEvent } from "aws-lambda";
import { thumbnailGeneration } from "./utils";
import { ERequestStatus, IThumbnailRequest } from "./thumbnail-request";
import { ThumbnailRequestDAO } from "./thumbnail-request-dao";

const thumbnailRequestDAO = new ThumbnailRequestDAO();

export async function handler(event: SQSEvent) {
	console.log(event);
	for (const record of event.Records) {
		const thumbnailRequest = JSON.parse(record.body) as IThumbnailRequest;
		// ignore test messages
		if (thumbnailRequest.storageLocation.includes("test")) {
			continue;
		}
		try {
			console.log("InProgress");
			await thumbnailRequestDAO.updateThumbnailRequest(
				thumbnailRequest.requestId,
				ERequestStatus.InProgress
			);
			const thumbnailUrls = await thumbnailGeneration(
				thumbnailRequest.storageLocation
			);
			console.log("Finished");
			await thumbnailRequestDAO.updateThumbnailRequest(
				thumbnailRequest.requestId,
				ERequestStatus.Finished,
				thumbnailUrls
			);
		} catch (e) {
			console.log("Failed");
			await thumbnailRequestDAO.updateThumbnailRequest(
				thumbnailRequest.requestId,
				ERequestStatus.Failed
			);
			console.log(e);
		}
	}
}

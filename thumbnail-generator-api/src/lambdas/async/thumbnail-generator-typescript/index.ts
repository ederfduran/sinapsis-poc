// import { SQSEvent } from "aws-lambda";
// import * as AWS from "aws-sdk";
// import { thumbnailGeneration } from "/opt/nodejs/file-utils";
// import {
// 	ERequestStatus,
// 	IThumbnailRequest,
// } from "/opt/nodejs/thumbnail-request";
// import { ThumbnailRequestDAO } from "/opt/nodejs/thumbnail-request-dao";

// const BUCKET_NAME = process.env.BUCKET_NAME;

// const s3 = new AWS.S3();
// const thumbnailRequestDAO = new ThumbnailRequestDAO();

// export async function handler(event: SQSEvent) {
// 	for (const record of event.Records) {
// 		const thumbnailRequest = JSON.parse(record.body) as IThumbnailRequest;
// 		try {
// 			console.log("InProgress");
// 			thumbnailRequestDAO.updateThumbnailRequest(
// 				thumbnailRequest.requestId,
// 				ERequestStatus.InProgress
// 			);
// 			const thumbnailUrls = await thumbnailGeneration(
// 				thumbnailRequest.storageLocation
// 			);
// 			console.log("Finished");
// 			thumbnailRequestDAO.updateThumbnailRequest(
// 				thumbnailRequest.requestId,
// 				ERequestStatus.Finished,
// 				thumbnailUrls
// 			);
// 		} catch (e) {
// 			console.log("Failed");
// 			thumbnailRequestDAO.updateThumbnailRequest(
// 				thumbnailRequest.requestId,
// 				ERequestStatus.Failed
// 			);
// 			console.log(e);
// 		}
// 	}
// }

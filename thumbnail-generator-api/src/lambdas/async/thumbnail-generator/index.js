const { updateThumbnailRequest } = require("./db");
const { thumbnailGeneration } = require("./utils");

exports.handler = async (event, context) => {
	console.log(event);
	for (const record of event.Records) {
		const thumbnailRequest = JSON.parse(record.body);
		try {
			console.log("InProgress");
			await updateThumbnailRequest(thumbnailRequest.requestId, "InProgress");
			const thumbnailUrls = await thumbnailGeneration(
				thumbnailRequest.storageLocation
			);
			await updateThumbnailRequest(
				thumbnailRequest.requestId,
				"Finished",
				thumbnailUrls
			);
			console.log("Finished");
		} catch (e) {
			await updateThumbnailRequest(thumbnailRequest.requestId, "Failed");
			console.log(e);
		}
	}
};

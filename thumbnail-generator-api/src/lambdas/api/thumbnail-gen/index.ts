import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import * as AWS from "aws-sdk";
import exceptionHandler from "/opt/nodejs/exception-handler";
import { fileType, uuid } from "/opt/nodejs/file-utils";
import Responses from "/opt/nodejs/responses";
import {
	ERequestStatus,
	IThumbnailRequest,
} from "/opt/nodejs/thumbnail-request";
import { ThumbnailRequestDAO } from "/opt/nodejs/thumbnail-request-dao";

const REGION = process.env.REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const QUEUE_URL = process.env.QUEUE_URL;
const allowedMimes = ["image/jpeg", "image/png"];

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const thumbnailRequestDAO = new ThumbnailRequestDAO();

async function loadImageToS3(body: any, requestId: string) {
	let imageData = body.image;
	if (body.image.substr(0, 7) === "base64,") {
		imageData = body.image.substr(7, body.image.length);
	}

	const buffer = Buffer.from(imageData, "base64");
	const fileInfo = await fileType.fromBuffer(buffer);
	const detectedMime = fileInfo!.mime;

	if (detectedMime !== body.mime) {
		throw new Error("inconsistent file extension");
	}

	const key = `images/${requestId}/${body.name}`;
	await s3
		.upload({
			Bucket: BUCKET_NAME!,
			Key: key,
			Body: buffer,
		})
		.promise();
	return key;
}

async function sendMessage(messageBody: string, messageAttributes = {}) {
	const data = await sqs
		.sendMessage({
			QueueUrl: QUEUE_URL!,
			MessageBody: messageBody,
			MessageAttributes: messageAttributes,
		})
		.promise();
	return data;
}

export async function handler(
	event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
	try {
		if (!event.body) {
			return Responses.BAD_REQUEST({ message: "empty body error" });
		}
		const body = JSON.parse(event.body);
		if (!body || !body.image || !body.mime) {
			return Responses.BAD_REQUEST({ message: "incorrect body on request" });
		}

		if (!allowedMimes.includes(body.mime)) {
			return Responses.BAD_REQUEST({
				message: "file extension is not allowed ",
			});
		}
		const requestId = uuid();
		const objectKey = await loadImageToS3(body, requestId);
		const thumbnailRequest: IThumbnailRequest = {
			requestId,
			storageLocation: objectKey,
			requestStatus: ERequestStatus.Received,
			created: new Date().toUTCString(),
		};
		await thumbnailRequestDAO.createThumbnailRequest(thumbnailRequest);
		await sendMessage(JSON.stringify(thumbnailRequest));
		return Responses.CREATED({
			thumbnailRequest,
		});
	} catch (e) {
		console.log(e);
		return exceptionHandler(e!);
	}
}

import * as AWS from "aws-sdk";
import { fileType } from "/opt/nodejs/file-utils";

const BUCKET_NAME = process.env.BUCKET_NAME;
const QUEUE_URL = process.env.QUEUE_URL;
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

export const loadImageToS3 = async (body: any, requestId: string) => {
	let imageData = body.image;
	if (body.image.substr(0, 7) === "base64,") {
		imageData = body.image.substr(7, body.image.length);
	}

	const buffer = Buffer.from(imageData, "base64");
	const fileInfo = await fileType.fromBuffer(buffer);
	const detectedMime = fileInfo!.mime;

	if (detectedMime !== body.mime) {
		throw new Error(
			`inconsistent file extension, detected ${detectedMime}, current ${body.mime}`
		);
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
};

export const sendMessage = async (
	messageBody: string,
	messageAttributes = {}
) => {
	const data = await sqs
		.sendMessage({
			QueueUrl: QUEUE_URL!,
			MessageBody: messageBody,
			MessageAttributes: messageAttributes,
		})
		.promise();
	return data;
};

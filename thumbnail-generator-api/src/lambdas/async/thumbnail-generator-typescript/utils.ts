import {
	PutObjectCommand,
	S3Client,
	PutObjectCommandInput,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as sharp from "sharp";
import type { Readable } from "stream";

const SIZES = [
	{ width: 400, height: 300 },
	{ width: 160, height: 120 },
	{ width: 120, height: 120 },
];
const REGION = process.env.REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3client = new S3Client({ region: REGION });

const s3Uploadv3 = async (files: any, baseKey: string) => {
	const thumbnailBaseKey = baseKey.replace("images", "thumbnails");
	const suffix = thumbnailBaseKey.split("/")[2];
	const params = files.map((file: any) => {
		const newSuffix = `${file.info.width}x${file.info.height}${suffix}`;
		const thumbnailKey = thumbnailBaseKey
			.replace(suffix, newSuffix)
			.replace("png", "jpg");
		return {
			Bucket: BUCKET_NAME,
			Key: thumbnailKey,
			Body: file.data.buffer,
		};
	});

	await Promise.all(
		params.map((param: PutObjectCommandInput) =>
			s3client.send(new PutObjectCommand(param))
		)
	);
	return params.map(
		(param: PutObjectCommandInput) =>
			`https://${BUCKET_NAME}.s3.amazonaws.com/${param.Key}`
	);
};

const getOriginalImage = async (key: string) => {
	const response = await s3client.send(
		new GetObjectCommand({
			Key: key,
			Bucket: BUCKET_NAME,
		})
	);
	const stream = response.Body as Readable;

	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on("data", (chunk) => chunks.push(chunk));
		stream.once("end", () => resolve(Buffer.concat(chunks)));
		stream.once("error", reject);
	});
};

export async function thumbnailGeneration(baseKey: string) {
	const originalImage = await getOriginalImage(baseKey);
	let src = sharp(originalImage);
	const tasks = [];
	for (const thumbDimentions of SIZES) {
		const task = src
			.resize({
				width: thumbDimentions.width,
				height: thumbDimentions.height,
			})
			.raw()
			.jpeg()
			.toBuffer({ resolveWithObject: true });
		tasks.push(task);
	}
	return Promise.all(tasks).then((data) => {
		return s3Uploadv3(data, baseKey);
	});
}

export * as fileType from "file-type";
export { v4 as uuid } from "uuid";
import {
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client,
} from "@aws-sdk/client-s3";
import * as AWS from "aws-sdk";
import sharp from "sharp";

const SIZES = [
	{ width: 400, height: 300 },
	{ width: 160, height: 120 },
	{ width: 120, height: 120 },
];
const REGION = process.env.REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3();
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
	return params.map((param: PutObjectCommandInput) => param.Key);
};

const getOriginalImage = async (key: string) => {
	const params: any = {
		Bucket: BUCKET_NAME,
		Key: key,
	};
	const image = await s3.getObject(params).promise();
	return image;
};

export async function thumbnailGeneration(baseKey: string) {
	const originalImage: any = await getOriginalImage(baseKey);
	let src = sharp(originalImage.Body);
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

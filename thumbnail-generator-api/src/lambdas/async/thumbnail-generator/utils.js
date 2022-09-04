const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const AWS = require("aws-sdk");
const sharp = require("sharp");

const SIZES = [
	{ width: 400, height: 300 },
	{ width: 160, height: 120 },
	{ width: 120, height: 120 },
];
const REGION = process.env.REGION;
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3();
const s3client = new S3Client({ region: REGION });

const s3Uploadv3 = async (files, baseKey) => {
	const thumbnailBaseKey = baseKey.replace("images", "thumbnails");
	const suffix = thumbnailBaseKey.split("/")[2];
	const params = files.map((file) => {
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
		params.map((param) => s3client.send(new PutObjectCommand(param)))
	);
	return params.map(
		(param) => `https://${BUCKET_NAME}.s3.amazonaws.com/${param.Key}`
	);
};
const getOriginalImage = async (key) => {
	const params = {
		Bucket: BUCKET_NAME,
		Key: key,
	};
	const image = await s3.getObject(params).promise();
	return image;
};

exports.thumbnailGeneration = async (baseKey) => {
	const originalImage = await getOriginalImage(baseKey);
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
};

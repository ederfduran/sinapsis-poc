// handler.integration-test.ts
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import * as fs from "fs";
import * as path from "path";
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	S3Client,
	HeadObjectCommand,
	DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const ddbDocClient = DynamoDBDocumentClient.from(
	new DynamoDBClient({ region: process.env.REGION })
);

const lambdaClient = new LambdaClient({ region: process.env.REGION });
const s3client = new S3Client({ region: process.env.REGION });
const lambdaFunctionName = process.env.THUMBNAIL_GEN_FUNCTION;

describe("Verifies thumbnail-gen-status lambda works correctly", function () {
	const image = fs.readFileSync(
		path.join(__dirname, "__testdata__/xbox.jpeg"),
		{
			encoding: "base64",
		}
	);
	const testImageData = {
		mime: "image/jpeg",
		name: "test-xbox.jpeg",
		image: "base64," + image,
	};
	const testAPIGatewayProxyEvent = {
		body: testImageData,
	};

	const readDynamoItem = async (key: string) => {
		const { Item } = await ddbDocClient.send(
			new GetCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					requestId: key,
				},
			})
		);
		return Item;
	};

	const cleanDynamo = async (requestId: string) => {
		await ddbDocClient.send(
			new DeleteCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					requestId,
				},
			})
		);
	};

	const checkS3Object = async (objectKey: string) => {
		const response = await s3client.send(
			new HeadObjectCommand({
				Bucket: process.env.BUCKET_NAME,
				Key: objectKey,
			})
		);
		return response;
	};

	const cleanS3Object = async (objectKey: string) => {
		await s3client.send(
			new DeleteObjectCommand({
				Bucket: process.env.BUCKET_NAME,
				Key: objectKey,
			})
		);
	};

	it("should create thumbnail request correctly", async () => {
		const { FunctionError, Payload } = await lambdaClient.send(
			new InvokeCommand({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: Buffer.from(JSON.stringify(testAPIGatewayProxyEvent)),
			})
		);
		const response = JSON.parse(Buffer.from(Payload!).toString());
		const thumbnailRequest = JSON.parse(response.body).thumbnailRequest;
		expect(FunctionError).toBeUndefined();
		expect(response.statusCode).toBe(201);
		expect(thumbnailRequest.requestStatus).toBe("Received");
		const item = await readDynamoItem(thumbnailRequest.requestId);
		expect(item).not.toBeUndefined();
		const s3ObjectCheck = await checkS3Object(thumbnailRequest.storageLocation);
		expect(s3ObjectCheck.$metadata.httpStatusCode).toBe(200);
		expect(s3ObjectCheck.ContentLength).toBeGreaterThan(100);
		// After all assertion clean the data
		cleanDynamo(thumbnailRequest.requestId);
		cleanS3Object(thumbnailRequest.storageLocation);
	});
});

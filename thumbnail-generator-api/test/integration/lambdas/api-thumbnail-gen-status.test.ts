// handler.integration-test.ts
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbDocClient = DynamoDBDocumentClient.from(
	new DynamoDBClient({ region: process.env.REGION })
);

const lambdaClient = new LambdaClient({ region: process.env.REGION });
const lambdaFunctionName = process.env.THUMBNAIL_GEN_STATUS_FUNCTION;

describe("Verifies thumbnail-gen-status lambda works correctly", function () {
	const testThumbnailRequest = {
		storageLocation: "test/image/location.png",
		created: "testDate",
		thumbnails: [
			"test1/thumbnails/image400x300profilepic.jpg",
			"test2/thumbnails/image160x120profilepic.jpg",
			"test3/thumbnails/image120x120profilepic.jpg",
		],
		requestStatus: "Finished",
		modified: "testModified",
		requestId: "testRequestId",
	};
	const testAPIGatewayProxyEvent = {
		pathParameters: { requestId: testThumbnailRequest.requestId },
	};

	const wrongAPIGatewayProxyEvent = {
		pathParameters: { requestId: "wrongRequestId" },
	};

	beforeAll(async () => {
		// Create test data
		await ddbDocClient.send(
			new PutCommand({
				TableName: process.env.TABLE_NAME,
				Item: testThumbnailRequest,
			})
		);
	});

	afterAll(async () => {
		// Clean
		await ddbDocClient.send(
			new DeleteCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					requestId: testThumbnailRequest.requestId,
				},
			})
		);
	});

	it("should get the thumbnail request correctly", async () => {
		const { FunctionError, Payload } = await lambdaClient.send(
			new InvokeCommand({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: Buffer.from(JSON.stringify(testAPIGatewayProxyEvent)),
			})
		);
		const response = JSON.parse(Buffer.from(Payload!).toString());
		const body = JSON.parse(response.body);
		expect(FunctionError).toBeUndefined();
		expect(response.statusCode).toBe(200);
		expect(body.thumbnailRequest).toMatchObject(testThumbnailRequest);
	});

	it("should get error on invalid requestId", async () => {
		const { FunctionError, Payload } = await lambdaClient.send(
			new InvokeCommand({
				FunctionName: lambdaFunctionName,
				InvocationType: "RequestResponse",
				Payload: Buffer.from(JSON.stringify(wrongAPIGatewayProxyEvent)),
			})
		);
		const response = JSON.parse(Buffer.from(Payload!).toString());
		const body = JSON.parse(response.body);
		expect(FunctionError).toBeUndefined();
		expect(response.statusCode).toBe(404);
		expect(body.message).toBe("Invalid thumbnail request id");
	});
});

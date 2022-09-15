import { ThumbnailRequestDAO } from "../../../src/layers/common/nodejs/thumbnail-request-dao";
import {
	IThumbnailRequest,
	ERequestStatus,
} from "../../../src/layers/common/nodejs/thumbnail-request";
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbDocClient = DynamoDBDocumentClient.from(
	new DynamoDBClient({ region: process.env.REGION })
);

describe("Verifies ThumbnailRequestDAO is interacting correctly with dynamo", function () {
	const thumbnailRequestDAO = new ThumbnailRequestDAO();
	const mockRequestId = "mockRequestId";
	const mockStorageLocation = "mock/storage/location";
	const mockRequestStatus = ERequestStatus.Received;
	const mockThumbnailRequest: IThumbnailRequest = {
		requestId: mockRequestId,
		storageLocation: mockStorageLocation,
		requestStatus: mockRequestStatus,
		created: new Date().toUTCString(),
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

	afterAll(async () => {
		// Clean
		await ddbDocClient.send(
			new DeleteCommand({
				TableName: process.env.TABLE_NAME,
				Key: {
					requestId: mockRequestId,
				},
			})
		);
	});

	it("should create thumbnail request", async () => {
		await thumbnailRequestDAO.createThumbnailRequest(mockThumbnailRequest);
		const item = await readDynamoItem(mockRequestId);
		expect(item!.storageLocation).toBe(mockStorageLocation);
		expect(item!.requestStatus).toBe(mockRequestStatus);
		expect(item!.requestId).toBe(mockRequestId);
	});

	it("should retrieve thumbnail request correctly", async () => {
		const item = await readDynamoItem(mockRequestId);
		const item_test = await thumbnailRequestDAO.getThumbnailRequest(
			mockRequestId
		);
		expect(item_test).not.toBeNull();
		expect(item).toMatchObject(item_test!);
	});

	it("should return null on non existing id", async () => {
		const item_test = await thumbnailRequestDAO.getThumbnailRequest(
			"fakeRequestId"
		);
		expect(item_test).toBeNull();
	});

	it("should update successfully thumbnail request", async () => {
		const update_result = await thumbnailRequestDAO.updateThumbnailRequest(
			mockRequestId,
			ERequestStatus.InProgress
		);
		const item = await readDynamoItem(mockRequestId);
		expect(update_result).not.toBeNull();
		expect(update_result!.requestStatus).toBe(ERequestStatus.InProgress);
		expect(item!.requestStatus).toBe(ERequestStatus.InProgress);
	});

	it("should update successfully thumbnail request with thumbnails urls", async () => {
		const update_result = await thumbnailRequestDAO.updateThumbnailRequest(
			mockRequestId,
			ERequestStatus.Finished,
			[
				"mock/path/to/thumbnails1",
				"mock/path/to/thumbnails2",
				"mock/path/to/thumbnails3",
			]
		);
		const item = await readDynamoItem(mockRequestId);
		expect(update_result).not.toBeNull();
		expect(update_result!.requestStatus).toBe(ERequestStatus.Finished);
		expect(item!.requestStatus).toBe(ERequestStatus.Finished);
		expect(item!.thumbnails.length).toBe(3);
	});
});

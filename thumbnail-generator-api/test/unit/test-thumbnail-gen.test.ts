import { APIGatewayProxyEvent } from "aws-lambda";
import {
	handler,
	thumbnailRequestDAO,
} from "../../src/lambdas/api/thumbnail-gen/index";

const mockOkBody = "Mock response";
const mockErroBody = "Mock error response";
const sendMessageMock = jest.fn().mockResolvedValue("");
const loadImageToS3Mock = jest.fn().mockResolvedValue("objectKeyMock");

jest.mock("/opt/nodejs/file-utils");
jest.mock("../../src/lambdas/api/thumbnail-gen/utils", () => ({
	sendMessage: () => sendMessageMock(),
	loadImageToS3: () => loadImageToS3Mock(),
}));
jest.mock("/opt/nodejs/exception-handler", () =>
	jest.fn().mockReturnValue({
		headers: {},
		statusCode: 500,
		body: '{"message":"Mock error"}',
	})
);

describe("Unit test for thumbnail-generation handler", function () {
	const createThumbnailRequestMock = jest.fn().mockResolvedValue("");
	jest.mock("/opt/nodejs/responses", () => ({
		CREATED: jest.fn().mockReturnValue({
			headers: {},
			statusCode: 201,
			body: mockOkBody,
		}),
		BAD_REQUEST: jest.fn().mockReturnValue({
			headers: {},
			statusCode: 400,
			body: mockErroBody,
		}),
		INTERNAL_ERROR: jest.fn().mockReturnValue({
			headers: {},
			statusCode: 500,
			body: mockErroBody,
		}),
	}));
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it("verifies main function", async () => {
		const event: APIGatewayProxyEvent = {
			body: JSON.stringify({
				image: "BASE64 Encoded Image",
				mime: "image/jpeg",
				name: "mockeImageName.jpeg",
			}),
		} as any;
		jest
			.spyOn(thumbnailRequestDAO, "createThumbnailRequest")
			.mockImplementation(createThumbnailRequestMock);
		const response = await handler(event);
		expect(loadImageToS3Mock).toBeCalledTimes(1);
		expect(createThumbnailRequestMock).toBeCalledTimes(1);
		expect(sendMessageMock).toBeCalledTimes(1);
		expect(response.statusCode).toEqual(201);
		expect(JSON.parse(response.body).thumbnailRequest.storageLocation).toEqual(
			"objectKeyMock"
		);
		expect(JSON.parse(response.body).thumbnailRequest.requestStatus).toEqual(
			"Received"
		);
	});

	it("Fails with invalid file name", async () => {
		const event: APIGatewayProxyEvent = {
			body: JSON.stringify({
				image: "BASE64 Encoded Image",
				mime: "image/jpeg",
				name: "áêīòü.jpeg",
			}),
		} as any;
		const response = await handler(event);
		expect(response.statusCode).toEqual(400);
		expect(JSON.parse(response.body).message).toEqual("invalid file name");
	});

	it("Fails with empty body", async () => {
		const event: APIGatewayProxyEvent = {
			body: "",
		} as any;
		const response = await handler(event);
		expect(response.statusCode).toEqual(400);
		expect(JSON.parse(response.body).message).toEqual("empty body error");
	});

	it("Fails with bad image format", async () => {
		const event: APIGatewayProxyEvent = {
			body: JSON.stringify({
				mime: "image/tiff",
				name: "mockeImageName.tiff",
			}),
		} as any;
		const response = await handler(event);
		expect(response.statusCode).toEqual(400);
		expect(JSON.parse(response.body).message).toEqual(
			"incorrect body on request"
		);
	});

	it("Fails with no image extention supported", async () => {
		const event: APIGatewayProxyEvent = {
			body: JSON.stringify({
				image: "BASE64 Encoded Image",
				mime: "image/tiff",
				name: "mockeImageName.tiff",
			}),
		} as any;
		const response = await handler(event);
		expect(response.statusCode).toEqual(400);
		expect(JSON.parse(response.body).message).toEqual(
			"file extension is not allowed"
		);
	});
});

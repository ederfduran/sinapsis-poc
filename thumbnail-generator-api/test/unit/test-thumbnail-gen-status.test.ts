import { APIGatewayProxyEvent } from "aws-lambda";
import { Error } from "aws-sdk/clients/ses";
import {
	handler,
	thumbnailRequestDAO,
} from "../../src/lambdas/api/thumbnail-gen-status";

const mockOkBody = "Mock response";
const mockError = "Mock error";

describe("Unit test for thumbnail-gen status handler", function () {
	jest.mock("/opt/nodejs/responses", () => ({
		OK: jest.fn().mockReturnValue({
			headers: {},
			statusCode: 200,
			body: mockOkBody,
		}),
		INTERNAL_ERROR: jest.fn().mockReturnValue({
			headers: {},
			statusCode: 500,
			body: mockOkBody,
		}),
	}));
	jest.mock("/opt/nodejs/exception-handler", () =>
		jest.fn().mockReturnValue({
			headers: {},
			statusCode: 500,
			body: '{"message":"Mock error"}',
		})
	);
	beforeEach(() => {
		jest.resetAllMocks();
	});
	it("verifies successful response", async () => {
		const event: APIGatewayProxyEvent = {
			pathParameters: {
				requestId: "1",
			},
		} as any;
		const mockfn = jest.fn().mockResolvedValue(mockOkBody);
		jest
			.spyOn(thumbnailRequestDAO, "getThumbnailRequest")
			.mockImplementation(mockfn);
		const result = await handler(event);
		expect(mockfn).toHaveBeenCalledTimes(1);
		expect(mockfn).toHaveBeenCalledWith("1");
		expect(result.statusCode).toEqual(200);
		expect(JSON.parse(result.body).thumbnailRequest).toEqual(mockOkBody);
	});

	it("verifies error response", async () => {
		const event: APIGatewayProxyEvent = {
			pathParameters: {
				requestId: "1",
			},
		} as any;
		const error = new Error(mockError);
		const mockfn = jest.fn().mockRejectedValue(error);
		jest
			.spyOn(thumbnailRequestDAO, "getThumbnailRequest")
			.mockImplementation(mockfn);
		const result = await handler(event);
		expect(mockfn).rejects.toBe(error);
		expect(result.statusCode).toEqual(500);
	});
});

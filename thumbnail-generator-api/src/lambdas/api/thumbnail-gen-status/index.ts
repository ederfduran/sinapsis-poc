import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	APIGatewayProxyEventPathParameters,
} from "aws-lambda";
import exceptionHandler from "/opt/nodejs/exception-handler";
import { ThumbnailRequestDAO } from "/opt/nodejs/thumbnail-request-dao";
import Responses from "/opt/nodejs/responses";

interface IThumbnailRequestPathParams
	extends APIGatewayProxyEventPathParameters {
	requestId: string;
}

export const thumbnailRequestDAO = new ThumbnailRequestDAO();

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		const { requestId } = event.pathParameters as IThumbnailRequestPathParams;
		const thumbnailRequest = await thumbnailRequestDAO.getThumbnailRequest(
			requestId
		);
		console.log(thumbnailRequest);
		if (!thumbnailRequest) {
			return Responses.NOT_FOUND({
				message: "Invalid thumbnail request id",
			});
		}
		return Responses.OK({
			thumbnailRequest,
		});
	} catch (e) {
		console.log(e);
		return exceptionHandler(e!);
	}
}

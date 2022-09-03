import {
	APIGatewayProxyEventV2,
	APIGatewayProxyResultV2,
	APIGatewayProxyEventPathParameters,
} from "aws-lambda";
import exceptionHandler from "/opt/nodejs/exception-handler";
import { ThumbnailRequestDAO } from "/opt/nodejs/thumbnail-request-dao";
import Responses from "/opt/nodejs/responses";

interface IThumbnailRequestPathParams
	extends APIGatewayProxyEventPathParameters {
	requestId: string;
}

const thumbnailRequestDAO = new ThumbnailRequestDAO();

export async function handler(
	event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
	try {
		const { requestId } = event.pathParameters as IThumbnailRequestPathParams;
		const thumbnailReq = await thumbnailRequestDAO.getThumbnailRequest(
			requestId
		);
		console.log(thumbnailReq);
		return Responses.OK({
			thumbnailReq,
		});
	} catch (e) {
		console.log(e);
		return exceptionHandler(e!);
	}
}

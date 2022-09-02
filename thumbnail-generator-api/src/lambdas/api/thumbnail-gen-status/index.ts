import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { IThumbnailRequest } from "/opt/nodejs/thumbnail-request";
import { ThumbnailRequestDAO } from "/opt/nodejs/thumbnail-request-dao";

const thumbnailRequestDAO = new ThumbnailRequestDAO();

export async function handler(
	event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
	console.log("event 👉", event);

	return {
		body: JSON.stringify({ message: "Successful lambda invocation" }),
		statusCode: 200,
	};
}

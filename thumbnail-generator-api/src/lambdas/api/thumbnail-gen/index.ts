import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { loadImageToS3, sendMessage } from "./utils";
import exceptionHandler from "/opt/nodejs/exception-handler";
import { uuid } from "/opt/nodejs/file-utils";
import Responses from "/opt/nodejs/responses";
import {
	ERequestStatus,
	IThumbnailRequest,
} from "/opt/nodejs/thumbnail-request";
import { ThumbnailRequestDAO } from "/opt/nodejs/thumbnail-request-dao";

const allowedMimes = ["image/jpeg", "image/jpg", "image/png"];
const SAFE_CHARACTERS: RegExp = /[^0-9a-zA-Z! _\\.\\*'\\(\\)\\\-/]/g;
export const thumbnailRequestDAO = new ThumbnailRequestDAO();

const readBody = (body: any) => {
	try {
		return JSON.parse(body);
	} catch (e) {
		return body;
	}
};

export async function handler(
	event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
	try {
		if (!event.body) {
			return Responses.BAD_REQUEST({ message: "empty body error" });
		}
		let body = readBody(event.body);
		if (!body || !body.image || !body.mime) {
			return Responses.BAD_REQUEST({ message: "incorrect body on request" });
		}

		if (!allowedMimes.includes(body.mime)) {
			return Responses.BAD_REQUEST({
				message: "file extension is not allowed",
			});
		}

		// TODO: Sanitize body.name
		if (SAFE_CHARACTERS.test(body.name)) {
			return Responses.BAD_REQUEST({
				message: "invalid file name",
			});
		}

		const requestId = uuid();
		const objectKey = await loadImageToS3(body, requestId);
		const thumbnailRequest: IThumbnailRequest = {
			requestId,
			storageLocation: objectKey,
			requestStatus: ERequestStatus.Received,
			created: new Date().toUTCString(),
		};
		await thumbnailRequestDAO.createThumbnailRequest(thumbnailRequest);
		await sendMessage(JSON.stringify(thumbnailRequest));
		return Responses.CREATED({
			thumbnailRequest,
		});
	} catch (e) {
		console.log(e);
		return exceptionHandler(e!);
	}
}

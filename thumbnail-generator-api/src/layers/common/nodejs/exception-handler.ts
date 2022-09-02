import { ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import Responses from "./responses";

const exceptionHandler = (e: any) => {
	if (e instanceof ResourceNotFoundException) {
		return Responses.NOT_FOUND({
			message: (e as Error).message,
		});
	} else {
		return Responses.INTERNAL_ERROR({
			message: (e as Error).message || "failed to upload image",
		});
	}
};

export default exceptionHandler;

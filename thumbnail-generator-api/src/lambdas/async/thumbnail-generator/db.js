const { marshall } = require("@aws-sdk/util-dynamodb");
const aws = require("aws-sdk");

const TABLE_NAME = process.env.TABLE_NAME;
const REGION = process.env.REGION;

const ddb = new aws.DynamoDB.DocumentClient({ region: REGION });

exports.updateThumbnailRequest = async (id, requestStatus, thumbnails) => {
	const updateDate = new Date().toUTCString();
	let expressionAttributeValues = {
		":requestStatus": requestStatus,
		":modified": updateDate,
	};
	let updateExpression =
		"set requestStatus = :requestStatus, modified = :modified";
	if (thumbnails) {
		expressionAttributeValues[":thumbnails"] = thumbnails;
		updateExpression += ", thumbnails = :thumbnails";
	}
	const thumbnailRequestParams = {
		Key: { requestId: id },
		UpdateExpression: updateExpression,
		ExpressionAttributeValues: expressionAttributeValues,
		ReturnValues: "ALL_NEW",
		TableName: TABLE_NAME,
	};
	const { Attributes } = await ddb.update(thumbnailRequestParams).promise();
	return Attributes;
};

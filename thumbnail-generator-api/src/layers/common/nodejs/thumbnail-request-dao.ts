import {
	DynamoDB,
	PutItemInput,
	UpdateItemInput,
	GetItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IThumbnailRequest, ERequestStatus } from "./thumbnail-request";
import * as aws from "aws-sdk";

export class ThumbnailRequestDAO {
	private _tableName: string;
	private _region: string;
	private _dynamoClient: DynamoDB;
	private _ddb: aws.DynamoDB.DocumentClient;
	constructor(tableName?: string, region?: string) {
		this._tableName = tableName ?? process.env.TABLE_NAME!;
		this._region = region ?? process.env.REGION!;
		this._dynamoClient = new DynamoDB({
			region: this._region,
		});
		this._ddb = new aws.DynamoDB.DocumentClient({ region: this._region });
	}

	public async createThumbnailRequest(newThumbnailRequest: IThumbnailRequest) {
		const thumbnailRequestParams: PutItemInput = {
			Item: marshall(newThumbnailRequest),
			TableName: this._tableName,
		};
		return await this._dynamoClient.putItem(thumbnailRequestParams);
	}
	public async getThumbnailRequest(requestId: string) {
		const queryThumbnailRequest: GetItemCommandInput = {
			Key: marshall({ requestId }),
			TableName: this._tableName,
		};
		const { Item } = await this._dynamoClient.getItem(queryThumbnailRequest);
		return Item ? unmarshall(Item) : null;
	}

	public async updateThumbnailRequest(
		id: string,
		requestStatus: ERequestStatus,
		thumbnails?: string[]
	) {
		const updateDate = new Date().toUTCString();
		let expressionAttributeValues: any = {
			":requestStatus": requestStatus.toString(),
			":modified": updateDate,
		};
		let updateExpression =
			"set requestStatus = :requestStatus, modified = :modified";
		if (thumbnails) {
			expressionAttributeValues[":thumbnails"] = thumbnails;
			updateExpression += ", thumbnails = :thumbnails";
		}
		const thumbnailRequestParams: aws.DynamoDB.DocumentClient.UpdateItemInput =
			{
				Key: { requestId: id },
				UpdateExpression: updateExpression,
				ExpressionAttributeValues: expressionAttributeValues,
				ReturnValues: "ALL_NEW",
				TableName: this._tableName,
			};

		const { Attributes } = await this._ddb
			.update(thumbnailRequestParams)
			.promise();
		return Attributes;
	}
}

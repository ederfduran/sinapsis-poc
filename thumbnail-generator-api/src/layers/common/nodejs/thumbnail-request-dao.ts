import {
	DynamoDB,
	PutItemInput,
	UpdateItemInput,
	GetItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IThumbnailRequest, ERequestStatus } from "./thumbnail-request";

export class ThumbnailRequestDAO {
	private _tableName: string;
	private _region: string;
	private _dynamoClient: DynamoDB;
	constructor(tableName?: string, region?: string) {
		this._tableName = tableName ?? process.env.TABLE_NAME!;
		this._region = region ?? process.env.REGION!;
		this._dynamoClient = new DynamoDB({
			region: this._region,
		});
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
		return Item;
	}

	public async updateThumbnailRequest(
		id: string,
		requestStatus: ERequestStatus,
		thumbnails?: string[]
	) {
		const updateDate = new Date().toUTCString();
		let expressionAttributeValues: any = {
			":requestStatus": requestStatus,
			":modified": updateDate,
		};
		let updateExpression =
			"set requestStatus=:requestStatus, modified=:modified";
		if (thumbnails) {
			expressionAttributeValues[":thumbnails"] = thumbnails;
			updateExpression += ", thumbnails=:thumbnails";
		}
		const thumbnailRequestParams: UpdateItemInput = {
			Key: marshall({ requestId: id }),
			UpdateExpression: updateExpression,
			ExpressionAttributeValues: marshall(expressionAttributeValues),
			ReturnValues: "ALL_NEW",
			TableName: this._tableName,
		};

		const { Attributes } = await this._dynamoClient.updateItem(
			thumbnailRequestParams
		);
		return Attributes ? unmarshall(Attributes) : null;
	}
}

import {
	PutItemCommand,
	PutItemCommandInput,
	UpdateItemCommand,
	UpdateItemCommandInput,
	GetItemCommand,
	GetItemCommandInput,
	DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { IThumbnailRequest, ERequestStatus } from "./thumbnail-request";
import * as aws from "aws-sdk";

export class ThumbnailRequestDAO {
	private _tableName: string;
	private _region: string;
	private _dynamoClient: DynamoDBClient;
	private _ddb: aws.DynamoDB.DocumentClient;
	constructor(tableName?: string, region?: string) {
		this._tableName = tableName ?? process.env.TABLE_NAME!;
		this._region = region ?? process.env.REGION!;
		this._dynamoClient = new DynamoDBClient({
			region: this._region,
		});
		this._ddb = new aws.DynamoDB.DocumentClient({ region: this._region });
	}

	public async createThumbnailRequest(newThumbnailRequest: IThumbnailRequest) {
		const thumbnailRequestParams: PutItemCommandInput = {
			Item: marshall(newThumbnailRequest),
			TableName: this._tableName,
		};
		return await this._dynamoClient.send(
			new PutItemCommand(thumbnailRequestParams)
		);
	}

	public async getThumbnailRequest(requestId: string) {
		const queryThumbnailRequest: GetItemCommandInput = {
			Key: marshall({ requestId }),
			TableName: this._tableName,
		};
		const { Item } = await this._dynamoClient.send(
			new GetItemCommand(queryThumbnailRequest)
		);
		return Item ? unmarshall(Item) : null;
	}

	public async updateThumbnailRequest(
		requestId: string,
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
		const thumbnailRequestParams: UpdateItemCommandInput = {
			Key: marshall({ requestId }),
			UpdateExpression: updateExpression,
			ExpressionAttributeValues: marshall(expressionAttributeValues),
			ReturnValues: "ALL_NEW",
			TableName: this._tableName,
		};

		const { Attributes } = await this._dynamoClient.send(
			new UpdateItemCommand(thumbnailRequestParams)
		);
		return Attributes ? unmarshall(Attributes) : null;
	}
}

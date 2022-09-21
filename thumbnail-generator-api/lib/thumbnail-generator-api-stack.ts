import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiGatewayStack } from "./api-gateway-stack";
import { DbStack } from "./db-stack";
import { LambdaStack } from "./lambda-stack";
import { S3BucketStack } from "./s3-stack";
import { SqsStack } from "./sqs-stack";
import { CDKContext } from "../types";

export class ThumbnailGeneratorApiStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		props: cdk.StackProps,
		context: CDKContext
	) {
		super(scope, id, props);
		const dbStack = new DbStack(
			this,
			"dbStack",
			{
				...props,
				stackName: "dbStack",
			},
			context
		);
		const s3Stack = new S3BucketStack(
			this,
			"s3Stack",
			{
				...props,
				stackName: "s3Stack",
			},
			context
		);
		const sqsStack = new SqsStack(this, context);
		const lambdaStack = new LambdaStack(
			this,
			dbStack.thumbnailRequestTable,
			s3Stack.thumbnailBucket,
			sqsStack.thumbnailQueue,
			context
		);
		new ApiGatewayStack(
			this,
			lambdaStack.postThumbnailGen,
			lambdaStack.thumbnailGenStatus,
			context
		);
	}
}

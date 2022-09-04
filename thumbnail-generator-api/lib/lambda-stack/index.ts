import * as cdk from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
	Code,
	Function as LambdaFunction,
	Runtime,
	LayerVersion,
	DockerImageFunction,
	DockerImageCode,
	CfnFunction,
} from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import * as path from "path";
import { BaseApiLambdaFunction } from "./base-api-lambda-stack";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
	NodejsFunction,
	NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";

export class LambdaStack {
	postThumbnailGen: BaseApiLambdaFunction;
	thumbnailGenDownload: BaseApiLambdaFunction;
	thumbnailGenStatus: BaseApiLambdaFunction;
	thumbnailGenerator: LambdaFunction;
	layers: LayerVersion[];
	stack: Construct;
	authorizer: NodejsFunction;
	constructor(
		scope: Construct,
		thumbnailRequestTable: Table,
		thumbnailBucket: Bucket,
		thumbnailQueue: Queue
	) {
		this.stack = scope;
		const commonLayer = new LayerVersion(this.stack, "common-dao-layer", {
			compatibleRuntimes: [Runtime.NODEJS_14_X, Runtime.NODEJS_12_X],
			code: Code.fromAsset(path.join(__dirname, "/../../src/layers/common")),
			description: "Manage operations in database",
		});

		const fileUtilsLayer = new LayerVersion(this.stack, "file-utils-layer", {
			compatibleRuntimes: [Runtime.NODEJS_14_X, Runtime.NODEJS_12_X],
			code: Code.fromAsset(
				path.join(__dirname, "/../../src/layers/file-utils")
			),
			description: "Manage operations with files",
		});

		this.layers = [commonLayer, fileUtilsLayer];
		this.createApiLambdas(
			thumbnailRequestTable,
			thumbnailBucket,
			thumbnailQueue
		);
		this.createThumbnailGeneratorLambda(
			thumbnailRequestTable,
			thumbnailBucket,
			thumbnailQueue
		);
		this.createAuthorizer();
	}

	private createThumbnailGeneratorLambda(
		thumbnailRequestTable: Table,
		thumbnailBucket: Bucket,
		thumbnailQueue: Queue
	) {
		// Configure path to Dockerfile
		const dockerfile = path.join(__dirname, "/../..");

		// Create AWS Lambda function and push image to ECR
		this.thumbnailGenerator = new DockerImageFunction(
			this.stack,
			"thumbnailGeneratorFunction",
			{
				code: DockerImageCode.fromImageAsset(dockerfile),
				functionName: "thumbnailGeneratorFunction",
				memorySize: 3008,
				environment: {
					QUEUE_URL: thumbnailQueue.queueUrl,
					BUCKET_NAME: thumbnailBucket.bucketName,
					TABLE_NAME: thumbnailRequestTable.tableName,
					REGION: cdk.Stack.of(this.stack).region,
				},
			}
		);

		// Update request status
		this.thumbnailGenerator.addToRolePolicy(
			new PolicyStatement({
				actions: ["dynamodb:UpdateItem"],
				resources: [thumbnailRequestTable.tableArn],
			})
		);
		// put results on s3
		this.thumbnailGenerator.addToRolePolicy(
			new PolicyStatement({
				actions: ["s3:PutObject", "s3:GetObject"],
				resources: [
					thumbnailBucket.bucketArn,
					`${thumbnailBucket.bucketArn}/*`,
				],
			})
		);

		// read msg from sqs
		this.thumbnailGenerator.addEventSource(
			new SqsEventSource(thumbnailQueue, {
				batchSize: 10, // default
				maxBatchingWindow: cdk.Duration.seconds(1),
				reportBatchItemFailures: true, // default to false
			})
		);

		this.thumbnailGenerator.addToRolePolicy(
			new PolicyStatement({
				actions: ["sqs:ReceiveMessage"],
				resources: [thumbnailQueue.queueArn],
			})
		);
	}

	private createApiLambdas(
		thumbnailRequestTable: Table,
		thumbnailBucket: Bucket,
		thumbnailQueue: Queue
	) {
		const apiRoot = "/../../src/lambdas/api";
		this.postThumbnailGen = new BaseApiLambdaFunction(
			this.stack,
			"createThumbnailRequestFunction",
			{
				functionName: "createThumbnailRequestFunction",
				entry: path.join(__dirname, `${apiRoot}/thumbnail-gen/index.ts`),
				layers: this.layers,
				environment: {
					QUEUE_URL: thumbnailQueue.queueUrl,
				},
			},
			thumbnailRequestTable,
			thumbnailBucket
		)
			.grantTableWrite()
			.grantBucketWrite();

		// send msg to sqs
		this.postThumbnailGen.addToRolePolicy(
			new PolicyStatement({
				actions: ["sqs:SendMessage"],
				resources: [thumbnailQueue.queueArn],
			})
		);

		this.thumbnailGenStatus = new BaseApiLambdaFunction(
			this.stack,
			"readThumbnailRequestStatusFunction",
			{
				functionName: "readThumbnailRequestStatusFunction",
				entry: path.join(__dirname, `${apiRoot}/thumbnail-gen-status/index.ts`),
				layers: this.layers,
			},
			thumbnailRequestTable,
			thumbnailBucket
		).grantTableRead();
	}

	private createAuthorizer() {
		const authorizerId = "auth0AuthorizerFunction";
		this.authorizer = new NodejsFunction(this.stack, authorizerId, {
			functionName: authorizerId,
			entry: path.join(__dirname, "/../../src/auth/index.js"),
			runtime: Runtime.NODEJS_12_X,
			handler: "handler",
			environment: {
				JWKS_URI: "https://dev-4pls1z4n.us.auth0.com/.well-known/jwks.json",
				AUDIENCE: "https://thumbnails",
				TOKEN_ISSUER: "https://dev-4pls1z4n.us.auth0.com/",
			},
		});
		// Override logical Id to reference correctly on OpenAPI
		const cfnLambda = this.authorizer.node.defaultChild as CfnFunction;
		cfnLambda.overrideLogicalId(authorizerId);
	}
}

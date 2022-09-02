import * as cdk from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnPermission, Runtime, CfnFunction } from "aws-cdk-lib/aws-lambda";
import {
	NodejsFunction,
	NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class BaseApiLambdaFunction extends NodejsFunction {
	private thumbnailRequestTable: Table;
	private thumbnailBucket: Bucket;
	constructor(
		scope: Construct,
		id: string,
		props: NodejsFunctionProps,
		thumbnailRequestTable: Table,
		thumbnailBucket: Bucket
	) {
		super(scope, id, {
			...props,
			runtime: Runtime.NODEJS_14_X,
			timeout: cdk.Duration.seconds(5),
			handler: "handler",
			// Performance improvements
			bundling: {
				minify: true,
				externalModules: ["aws-sdk"],
			},
		});
		this.thumbnailRequestTable = thumbnailRequestTable;
		this.thumbnailBucket = thumbnailBucket;
		this.addEnvironment("TABLE_NAME", this.thumbnailRequestTable.tableName);
		this.addEnvironment("BUCKET_NAME", this.thumbnailBucket.bucketName);
		this.addEnvironment("REGION", cdk.Stack.of(this).region);
		this.grantApiPermission();
		// Override logical Id to reference correctly on OpenAPI
		const cfnLambda = this.node.defaultChild as CfnFunction;
		cfnLambda.overrideLogicalId(id);
	}

	public grantApiPermission() {
		new CfnPermission(this, `invoke-permission-${this.node.id}`, {
			action: "lambda:InvokeFunction",
			principal: "apigateway.amazonaws.com",
			functionName: this.functionArn,
		});
	}

	public grantTableRead(): BaseApiLambdaFunction {
		this.addToRolePolicy(
			new PolicyStatement({
				actions: [
					"dynamodb:DescribeTable",
					"dynamodb:GetItem",
					"dynamodb:Scan",
				],
				resources: [this.thumbnailRequestTable.tableArn],
			})
		);
		return this;
	}

	public grantTableWrite(): BaseApiLambdaFunction {
		this.addToRolePolicy(
			new PolicyStatement({
				actions: [
					"dynamodb:PutItem",
					"dynamodb:DeleteItem",
					"dynamodb:UpdateItem",
					"dynamodb:BatchWriteItem",
				],
				resources: [this.thumbnailRequestTable.tableArn],
			})
		);
		return this;
	}

	public grantBucketRead(): BaseApiLambdaFunction {
		this.addToRolePolicy(
			new PolicyStatement({
				actions: ["s3:GetObject", "s3:GetObjectAcl"],
				resources: [`${this.thumbnailBucket.bucketArn}/*`],
			})
		);
		return this;
	}

	public grantBucketWrite(): BaseApiLambdaFunction {
		this.addToRolePolicy(
			new PolicyStatement({
				actions: ["s3:PutObject", "s3:PutObjectAcl"],
				resources: [`${this.thumbnailBucket.bucketArn}/*`],
			})
		);
		return this;
	}
}

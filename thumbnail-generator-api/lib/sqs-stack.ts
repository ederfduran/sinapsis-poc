import * as cdk from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

export class SqsStack {
	thumbnailQueue: Queue;
	constructor(scope: Construct) {
		this.thumbnailQueue = new Queue(scope, "thumbnailQueue");
	}
}

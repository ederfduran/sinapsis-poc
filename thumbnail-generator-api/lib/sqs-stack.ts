import * as cdk from "aws-cdk-lib";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { CDKContext } from "../types";

export class SqsStack {
	thumbnailQueue: Queue;
	constructor(scope: Construct, context: CDKContext) {
		this.thumbnailQueue = new Queue(scope, "thumbnailQueue", {
			queueName: `thumbnails-requests-queue-${context.environment}`,
		});
	}
}

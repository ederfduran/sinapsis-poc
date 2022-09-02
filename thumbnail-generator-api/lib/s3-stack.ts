import * as cdk from "aws-cdk-lib";
import {
	Bucket,
	BucketEncryption,
	BlockPublicAccess,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3BucketStack extends cdk.Stack {
	thumbnailBucket: Bucket;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		this.thumbnailBucket = new Bucket(scope, "sinapsis-thumbnail-bucket", {
			bucketName: "sinapsis-thumbnail-bucket",
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: false,
			versioned: false,
			// Not recomended from prod env
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});
	}
}

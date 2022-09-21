import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import {
	Bucket,
	BucketEncryption,
	BlockPublicAccess,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { CDKContext } from "../types";

export class S3BucketStack extends cdk.Stack {
	thumbnailBucket: Bucket;

	constructor(
		scope: Construct,
		id: string,
		props: cdk.StackProps,
		context: CDKContext
	) {
		super(scope, id, props);
		this.thumbnailBucket = new Bucket(this, "sinapsis-thumbnail-bucket", {
			bucketName: `sinapsis-thumbnail-bucket-${context.environment}`,
			blockPublicAccess: {
				blockPublicAcls: true,
				ignorePublicAcls: true,
				blockPublicPolicy: false,
				restrictPublicBuckets: false,
			},
			encryption: BucketEncryption.S3_MANAGED,
			enforceSSL: false,
			versioned: false,
			// Not recomended from prod env
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		this.thumbnailBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				principals: [new iam.StarPrincipal()],
				actions: ["s3:GetObject"],
				resources: [`${this.thumbnailBucket.bucketArn}/thumbnails/*`],
			})
		);
	}
}

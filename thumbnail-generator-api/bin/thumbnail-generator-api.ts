#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ThumbnailGeneratorApiStack } from "../lib/thumbnail-generator-api-stack";

const app = new cdk.App();
new ThumbnailGeneratorApiStack(app, "ThumbnailGeneratorApiStack", {
	env: {
		account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
	},
	/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

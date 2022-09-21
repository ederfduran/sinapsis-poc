#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ThumbnailGeneratorApiStack } from "../lib/thumbnail-generator-api-stack";
import { CDKContext } from "../types";
import gitBranch from "git-branch";

// Get CDK Context based on git branch
export const getContext = async (app: cdk.App): Promise<CDKContext> => {
	return new Promise(async (resolve, reject) => {
		try {
			const currentBranch = await gitBranch();

			const environment = app.node
				.tryGetContext("environments")
				.find((e: any) => e.branchName === currentBranch);

			return resolve({ ...environment });
		} catch (error) {
			console.error(error);
			return reject();
		}
	});
};

// Create Stacks
const createStacks = async () => {
	try {
		const app = new cdk.App();
		const context = await getContext(app);

		const tags: any = {
			Environment: context.environment,
		};

		new ThumbnailGeneratorApiStack(
			app,
			"ThumbnailGeneratorApiStack",
			{
				env: {
					account: process.env.CDK_DEPLOY_ACCOUNT || context.accountNumber,
					region: process.env.CDK_DEPLOY_REGION || context.region,
				},
				tags,
			},
			context
		);
	} catch (error) {
		console.error(error);
	}
};

createStacks();
